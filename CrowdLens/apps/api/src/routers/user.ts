import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { prismaClient } from "db/client";
import { OptionType, SettleStatus, SignInRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../middleware";
import { createTaskSchema } from "../types";
import { Connection, PublicKey } from "@solana/web3.js";
import { findTaskPda } from "crowdlens-idl";
import { v4 as uuidv4 } from "uuid";
import { env } from "../env";
import { isUniqueConstraintError, sendError } from "../http";
import { issueNonce, verifySignedNonce } from "../auth/nonce";
import { authRateLimit, exportRateLimit, presignRateLimit } from "../rateLimit";
import { economicsPayload, isAllowedBatchSize, isOnchainSettlement, priceFor, TREASURY_ADDRESS } from "../economics";
import { exportRowsToCsv, exportTaskVotes, taskAnalytics } from "../analytics";
import { verifyTaskPayment } from "../solana/payment";
import { verifyCreateTask } from "../solana/verifyCreateTask";
import { fetchCreatorNonce } from "../solana/escrow";

const router = Router();

const connection = new Connection(env.RPC_URL);

const s3Client = new S3Client({
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    region: env.AWS_REGION,
});

interface Option {
    id: number;
    image_url: string;
    content: string;
    type: OptionType;
    task_id: number;
}

interface VoteRow {
    option_id: number;
    option: Option;
}

router.get("/economics", (_req, res) => {
    res.json(economicsPayload());
});

router.get("/task/onchain-params", authMiddleware, async (req, res) => {
    if (!isOnchainSettlement()) {
        sendError(res, 400, "Custodial settlement mode");
        return;
    }

    const userId = req.userId;
    const user = await prismaClient.user.findUnique({
        where: { id: Number(userId) },
    });
    if (!user) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const requiredSubmissions = Number(req.query.requiredSubmissions);
    if (!isAllowedBatchSize(requiredSubmissions)) {
        sendError(res, 400, "Invalid batch size", { allowed: economicsPayload().batchSizes });
        return;
    }

    const amount = priceFor(requiredSubmissions);
    const programId = env.CROWDLENS_PROGRAM_ID;
    const nonce = await fetchCreatorNonce(user.address);
    const [taskPda] = findTaskPda(new PublicKey(user.address), nonce, new PublicKey(programId));
    const dbCount = await prismaClient.task.count({
        where: { user_id: user.id, settle_status: { not: SettleStatus.Offchain } },
    });

    res.json({
        programId,
        nonce,
        taskPda: taskPda.toBase58(),
        amount,
        dbTaskCount: dbCount,
    });
});

router.get("/tasks", authMiddleware, async (req, res) => {
    const userId = req.userId;

    if (userId === undefined) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const tasks = await prismaClient.task.findMany({
        where: { user_id: userId },
        orderBy: { id: "desc" },
        take: 50,
        select: {
            id: true,
            title: true,
            done: true,
            amount: true,
            required_submissions: true,
            winner_option_id: true,
            _count: {
                select: { submissions: true },
            },
            options: {
                orderBy: { id: "asc" },
                take: 1,
                select: { image_url: true, content: true, type: true },
            },
        },
    });

    res.json({
        tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            done: task.done,
            amount: task.amount,
            required_submissions: task.required_submissions,
            submission_count: task._count.submissions,
            winner_option_id: task.winner_option_id,
            optionType: task.options[0]?.type ?? "Image",
            preview:
                task.options[0]?.type === "Text"
                    ? snippet(task.options[0].content)
                    : (task.options[0]?.image_url ?? null),
            thumbnail: task.options[0]?.type === "Text" ? null : (task.options[0]?.image_url ?? null),
        })),
    });
});

router.get("/task", authMiddleware, async (req, res) => {
    const taskId = req.query.taskId;
    const userId = req.userId;

    const taskDetails = await prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    })

    if(!taskDetails) {
        sendError(res, 403, "You don't have access to this task");
        return
    }

    const responses = await prismaClient.submission.findMany({
        where:{
            task_id:Number(taskId)
        },
        include: {
            option: true
        }
    })

    const result: Record<string, {
        count: number,
        option: {
            type: OptionType;
            content: string;
            imageUrl: string;
        }
    }> = {};

    taskDetails.options.forEach((option: Option) => {
        result[option.id] = {
            count: 0,
            option: {
                type: option.type,
                content: option.content,
                imageUrl: option.type === "Text" ? "" : option.image_url,
            }
        }
    })

    responses.forEach((r: VoteRow) => {
        result[r.option_id].count++;
    })

    const analytics = await taskAnalytics(taskDetails.id);

    res.json({
        result,
        analytics,
        taskDetails: {
            title: taskDetails.title,
            done: taskDetails.done,
            required_submissions: taskDetails.required_submissions,
            submission_count: responses.length,
            winner_option_id: taskDetails.winner_option_id,
            signature: taskDetails.signature,
            escrow_pda: taskDetails.escrow_pda,
            vote_commitment: taskDetails.vote_commitment,
            settle_status: taskDetails.settle_status,
        }
    })
})

router.get("/task/export", authMiddleware, exportRateLimit, async (req, res) => {
    const taskId = Number(req.query.taskId);
    const userId = req.userId;
    const format = typeof req.query.format === "string" ? req.query.format.toLowerCase() : "json";

    if (!Number.isInteger(taskId) || taskId <= 0) {
        sendError(res, 400, "Invalid task id");
        return;
    }
    if (format !== "json" && format !== "csv") {
        sendError(res, 400, "format must be csv or json");
        return;
    }

    const owned = await prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: taskId,
        },
        select: { id: true },
    });
    if (!owned) {
        sendError(res, 403, "You don't have access to this task");
        return;
    }

    const rows = await exportTaskVotes(taskId);
    if (!rows) {
        sendError(res, 403, "You don't have access to this task");
        return;
    }

    const filename = `crowdlens-task-${taskId}.${format}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.send(exportRowsToCsv(rows));
        return;
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(rows);
});

router.post("/task", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const user = await prismaClient.user.findUnique({
        where: {
            id: Number(userId)
        }
    })

    if (!user) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const requiredSubmissionsEarly = Number((req.body as { requiredSubmissions?: unknown })?.requiredSubmissions);
    if (!isAllowedBatchSize(requiredSubmissionsEarly)) {
        sendError(res, 400, "Invalid batch size", { allowed: economicsPayload().batchSizes });
        return;
    }
    
    const parsedBody = createTaskSchema.safeParse(req.body);
    
    if(!parsedBody.success) {
        sendError(res, 400, "Invalid inputs", parsedBody.error.errors);
        return;
    }

    const requiredSubmissions = parsedBody.data.requiredSubmissions;
    if (!isAllowedBatchSize(requiredSubmissions)) {
        sendError(res, 400, "Invalid batch size", { allowed: economicsPayload().batchSizes });
        return;
    }

    const expectedLamports = priceFor(requiredSubmissions);
    const transaction = await getConfirmedTransaction(parsedBody.data.signature);

    if (!transaction) {
        sendError(res, 400, "Transaction not found");
        return;
    }

    let escrowPda: string | null = null;
    let escrowNonce: number | null = null;
    let settleStatus: SettleStatus = SettleStatus.Offchain;

    if (isOnchainSettlement()) {
        const payment = verifyCreateTask(transaction, {
            expectedLamports,
            expectedRequired: requiredSubmissions,
            programId: env.CROWDLENS_PROGRAM_ID,
            sender: user.address,
        });
        if (!payment.ok) {
            sendError(res, 400, payment.error);
            return;
        }
        escrowPda = payment.taskPda;
        escrowNonce = payment.nonce;
        settleStatus = SettleStatus.Escrowed;
    } else {
        const payment = verifyTaskPayment(transaction, {
            expectedLamports,
            treasury: TREASURY_ADDRESS,
            sender: user.address,
        });
        if (!payment.ok) {
            sendError(res, 400, payment.error);
            return;
        }
    }

    try {
        const taskResult = await prismaClient.$transaction(async (tx) => {
            const title = parsedBody.data.title?.trim() || undefined;

            const task = await tx.task.create({
                data: {
                    title,
                    user_id: Number(userId),
                    signature: parsedBody.data.signature,
                    amount: expectedLamports,
                    required_submissions: requiredSubmissions,
                    escrow_pda: escrowPda,
                    escrow_nonce: escrowNonce,
                    settle_status: settleStatus,
                }
            })

            await tx.option.createMany({
                data: parsedBody.data.options.map((x) => ({
                    image_url: x.imageUrl!,
                    content: "",
                    type: OptionType.Image,
                    task_id: task.id,
                })),
            })
            return task
        })
        res.json({
            id: taskResult.id
        })
    } catch (err) {
        if (isUniqueConstraintError(err)) {
            sendError(res, 409, "Signature already used");
            return;
        }
        throw err;
    }
});


router.get("/presigned-url", authMiddleware, presignRateLimit, async (req, res) => {
    try {
      const userId = req.userId;
      const contentType =
        typeof req.query.contentType === "string" ? req.query.contentType : "image/jpeg";

      if (!contentType.startsWith("image/")) {
        sendError(res, 400, "contentType must be an image/* MIME type");
        return;
      }

      const extension = extensionForContentType(contentType);
      const key = `user/${userId}/${uuidv4()}/image.${extension}`;
  
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Conditions: [
          ["content-length-range", 0, 5 * 1024 * 1024],
          ["starts-with", "$key", `user/${userId}/`],
          ["starts-with", "$Content-Type", "image/"],
        ],
        Fields: {
          "Content-Type": contentType,
        },
        Expires: 3600,
      });
  
      res.json({ preSignedUrl: url, fields });
    } catch (err) {
      console.error("Presigned URL generation error:", err);
      sendError(res, 500, "Failed to generate presigned URL");
    }
  });

router.post("/signin/nonce", authRateLimit, async (req, res) => {
    await issueNonce(req, res, SignInRole.User);
});

router.post("/signin", authRateLimit, async (req, res) => {
    await verifySignedNonce(req, res, SignInRole.User, env.JWT_SECRET, async (address) => {
        const existing = await prismaClient.user.findUnique({
            where: { address },
        });
        if (existing) {
            return existing;
        }
        return prismaClient.user.create({
            data: { address },
        });
    });
});

function snippet(value: string, max = 80): string {
    const trimmed = value.trim();
    if (trimmed.length <= max) {
        return trimmed;
    }
    return `${trimmed.slice(0, max - 1)}…`;
}

function extensionForContentType(contentType: string): string {
    const map: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    };
    return map[contentType] ?? "jpg";
}

async function getConfirmedTransaction(signature: string) {
    try {
        for (let attempt = 0; attempt < 5; attempt++) {
            const transaction = await connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 1,
                commitment: "confirmed",
            });

            if (transaction) {
                return transaction;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    } catch {
        return null;
    }

    return null;
}

export default router;
