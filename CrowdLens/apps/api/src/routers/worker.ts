import { prismaClient } from "db/client";
import { SignInRole, SettleStatus } from "@prisma/client";
import { Router } from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { workerAuthMiddleware } from "../middleware";
import { getNextTask, getTaskForWorker, listOpenTasks, parseExcludeIds } from "../db";
import { createSubmissionInput } from "../types";
import { env } from "../env";
import { HttpError, isUniqueConstraintError, sendError } from "../http";
import { issueNonce, verifySignedNonce } from "../auth/nonce";
import { authRateLimit, payoutRateLimit, submissionRateLimit } from "../rateLimit";
import { submitVote } from "../taskLifecycle";
import { executePayout } from "../payouts/engine";
import { minPayoutLamports } from "../economics";
import { assertVoteAllowed } from "../sybil";
import { settleEscrow } from "../solana/escrow";

const router = Router();

router.post("/signin/nonce", authRateLimit, async (req, res) => {
    await issueNonce(req, res, SignInRole.Worker);
});

router.post("/signin", authRateLimit, async (req, res) => {
    await verifySignedNonce(req, res, SignInRole.Worker, env.WORKER_JWT_SECRET, async (address) => {
        if (env.WALLET_MIN_SIGNATURES > 0) {
            const connection = new Connection(env.RPC_URL);
            const signatures = await connection.getSignaturesForAddress(
                new PublicKey(address),
                { limit: env.WALLET_MIN_SIGNATURES },
            );
            if (signatures.length < env.WALLET_MIN_SIGNATURES) {
                throw new HttpError(403, "Wallet has too little on-chain activity");
            }
        }
        const existing = await prismaClient.worker.findUnique({
            where: { address },
        });
        if (existing) {
            return existing;
        }
        return prismaClient.worker.create({
            data: {
                address,
                pending_amount: 0,
                locked_amount: 0,
            },
        });
    });
});

router.get("/nextTask", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const workerAddress = req.walletAddress;

    if (userId === undefined || !workerAddress) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const task = await getNextTask(userId, workerAddress, parseExcludeIds(req.query.exclude));

    res.json({
        task: task ?? null,
    });
});

router.get("/tasks", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const workerAddress = req.walletAddress;

    if (userId === undefined || !workerAddress) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const tasks = await listOpenTasks(userId, workerAddress);
    res.json({ tasks });
});

router.get("/task", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const workerAddress = req.walletAddress;

    if (userId === undefined || !workerAddress) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const taskId = Number(req.query.taskId);
    const task = await getTaskForWorker(userId, workerAddress, taskId);
    if (!task) {
        sendError(res, 404, "Task not found");
        return;
    }

    res.json({ task });
});

router.post("/submission", workerAuthMiddleware, submissionRateLimit, async (req, res) => {
    const userId = req.userId;
    const workerAddress = req.walletAddress;

    if (userId === undefined || !workerAddress) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const parsedBody = createSubmissionInput.safeParse(req.body);

    if (!parsedBody.success) {
        sendError(res, 400, "Incorrect inputs", parsedBody.error.errors);
        return;
    }

    const taskId = Number(parsedBody.data.taskId);
    const task = await prismaClient.task.findFirst({
        where: {
            id: taskId,
            done: false,
            user: {
                address: {
                    not: workerAddress,
                },
            },
            submissions: {
                none: {
                    worker_id: userId,
                },
            },
        },
        include: {
            options: true,
        },
    });
    if (!task) {
        sendError(res, 400, "Incorrect task id");
        return;
    }

    try {
        await assertVoteAllowed(userId, taskId);
    } catch (err) {
        if (err instanceof HttpError) {
            sendError(res, err.status, err.error, err.details);
            return;
        }
        throw err;
    }

    const optionId = Number(parsedBody.data.selection);
    const belongsToTask = task.options.some((option) => option.id === optionId);
    if (!belongsToTask) {
        sendError(res, 400, "Option does not belong to this task");
        return;
    }

    let amount: number;
    try {
        amount = await prismaClient.$transaction(async (tx) => {
            return submitVote(tx, {
                taskId: Number(parsedBody.data.taskId),
                workerId: userId,
                optionId,
                comment: parsedBody.data.comment,
            });
        });
    } catch (err) {
        if (err instanceof HttpError) {
            sendError(res, err.status, err.error, err.details);
            return;
        }
        if (isUniqueConstraintError(err)) {
            sendError(res, 400, "Already submitted for this task");
            return;
        }
        throw err;
    }

    try {
        const closed = await prismaClient.task.findUnique({
            where: { id: taskId },
            select: { done: true, settle_status: true },
        });
        if (
            closed?.done &&
            (closed.settle_status === SettleStatus.Settling ||
                closed.settle_status === SettleStatus.Failed)
        ) {
            await settleEscrow(taskId);
        }
    } catch (err) {
        console.error("escrow settle failed", taskId, err);
        await prismaClient.task.update({
            where: { id: taskId },
            data: { settle_status: SettleStatus.Failed },
        }).catch((updateErr) => {
            console.error("failed to mark escrow settle Failed", updateErr);
        });
    }

    const nextTask = await getNextTask(userId, workerAddress);
    res.json({
        nextTask,
        amount
    })
})

router.get("/balance", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    res.json({
        pendingBal: worker?.pending_amount ?? 0,
        lockedBal: worker?.locked_amount ?? 0,
        unsettledBal: worker?.unsettled_amount ?? 0,
        reputation: worker?.reputation ?? 50,
        alignedVotes: worker?.aligned_votes ?? 0,
        outlierVotes: worker?.outlier_votes ?? 0,
        minPayout: await minPayoutLamports(),
    })
})

router.post("/payout", workerAuthMiddleware, payoutRateLimit, async (req, res) => {
    const userId = req.userId;

    if (userId === undefined) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    try {
        const result = await executePayout(userId);
        res.json(result);
    } catch (err) {
        if (err instanceof HttpError) {
            sendError(res, err.status, err.error, err.details);
            return;
        }
        throw err;
    }
})

router.get("/payouts", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    if (userId === undefined) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const payouts = await prismaClient.payouts.findMany({
        where: { worker_id: userId },
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            amount: true,
            signature: true,
            status: true,
            source: true,
            created_at: true,
        },
    });

    res.json({ payouts });
})

router.get("/stats", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    if (userId === undefined) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const [worker, votesSubmitted, earned] = await Promise.all([
        prismaClient.worker.findUnique({
            where: { id: userId },
        }),
        prismaClient.submission.count({
            where: { worker_id: userId },
        }),
        prismaClient.submission.aggregate({
            where: { worker_id: userId },
            _sum: { amount: true },
        }),
    ]);

    res.json({
        pendingBal: worker?.pending_amount ?? 0,
        lockedBal: worker?.locked_amount ?? 0,
        unsettledBal: worker?.unsettled_amount ?? 0,
        minPayout: await minPayoutLamports(),
        votesSubmitted,
        totalEarned: earned._sum.amount ?? 0,
        reputation: worker?.reputation ?? 50,
        alignedVotes: worker?.aligned_votes ?? 0,
        outlierVotes: worker?.outlier_votes ?? 0,
    });
})

router.get("/submissions", workerAuthMiddleware, async (req, res) => {
    const userId = req.userId;

    if (userId === undefined) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    const submissions = await prismaClient.submission.findMany({
        where: { worker_id: userId },
        orderBy: { id: "desc" },
        take: 50,
        select: {
            id: true,
            amount: true,
            comment: true,
            payout_signature: true,
            task: {
                select: {
                    id: true,
                    title: true,
                    done: true,
                },
            },
            option: {
                select: {
                    id: true,
                    image_url: true,
                    content: true,
                    type: true,
                },
            },
        },
    });

    res.json({ submissions });
})


export default router;
