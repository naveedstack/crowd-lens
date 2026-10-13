import { prismaClient } from "db/client";
import { OptionType } from "@prisma/client";
import { rewardFor } from "./economics";

export function parseExcludeIds(raw: unknown): number[] {
    const value = Array.isArray(raw) ? raw.join(",") : typeof raw === "string" ? raw : "";
    return [
        ...new Set(
            value
                .split(",")
                .map((part) => Number(part.trim()))
                .filter((n) => Number.isInteger(n) && n > 0),
        ),
    ];
}

function snippet(value: string, max = 80): string {
    const trimmed = value.trim();
    if (trimmed.length <= max) {
        return trimmed;
    }
    return `${trimmed.slice(0, max - 1)}…`;
}

function workerOpenTaskWhere(
    userId: number,
    workerAddress: string,
    extra?: { id?: number; excludeIds?: number[] },
) {
    const idFilter =
        extra?.id != null
            ? { id: extra.id }
            : extra?.excludeIds && extra.excludeIds.length > 0
                ? { id: { notIn: extra.excludeIds } }
                : {};
    return {
        ...idFilter,
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
        options: {
            every: { type: OptionType.Image },
        },
    };
}

const taskDetailSelect = {
    id: true,
    amount: true,
    title: true,
    options: {
        select: {
            id: true,
            image_url: true,
            content: true,
            type: true,
            task_id: true,
        },
    },
    required_submissions: true,
    _count: {
        select: {
            submissions: true,
        },
    },
} as const;

function formatTaskDetail(task: {
    id: number;
    amount: number;
    title: string | null;
    required_submissions: number;
    options: Array<{
        id: number;
        image_url: string;
        content: string;
        type: string;
        task_id: number;
    }>;
    _count: { submissions: number };
}) {
    return {
        id: task.id,
        amount: task.amount,
        title: task.title,
        options: task.options,
        required_submissions: task.required_submissions,
        submission_count: task._count.submissions,
        reward: rewardFor(task.amount, task.required_submissions),
    };
}

async function markServed(workerId: number, taskId: number) {
    await prismaClient.taskServe.upsert({
        where: {
            worker_id_task_id: {
                worker_id: workerId,
                task_id: taskId,
            },
        },
        create: {
            worker_id: workerId,
            task_id: taskId,
        },
        update: {},
    });
}

export const getNextTask = async (
    userId: number,
    workerAddress: string,
    excludeIds: number[] = [],
) => {
    const task = await prismaClient.task.findFirst({
        where: workerOpenTaskWhere(userId, workerAddress, { excludeIds }),
        orderBy: { id: "desc" },
        select: taskDetailSelect,
    });

    if (!task) {
        return null;
    }

    await markServed(userId, task.id);
    return formatTaskDetail(task);
};

export async function listOpenTasks(userId: number, workerAddress: string) {
    const tasks = await prismaClient.task.findMany({
        where: workerOpenTaskWhere(userId, workerAddress),
        orderBy: { id: "desc" },
        take: 50,
        select: {
            id: true,
            title: true,
            amount: true,
            required_submissions: true,
            _count: { select: { submissions: true } },
            options: {
                orderBy: { id: "asc" },
                take: 1,
                select: { image_url: true, content: true, type: true },
            },
        },
    });

    return tasks.map((task) => {
        const first = task.options[0];
        const optionType = first?.type ?? "Image";
        return {
            id: task.id,
            title: task.title,
            amount: task.amount,
            required_submissions: task.required_submissions,
            submission_count: task._count.submissions,
            reward: rewardFor(task.amount, task.required_submissions),
            optionType,
            preview:
                optionType === "Text"
                    ? snippet(first?.content ?? "")
                    : (first?.image_url ?? null),
            thumbnail: optionType === "Text" ? null : (first?.image_url ?? null),
        };
    });
}

export async function getTaskForWorker(
    userId: number,
    workerAddress: string,
    taskId: number,
) {
    if (!Number.isInteger(taskId) || taskId <= 0) {
        return null;
    }

    const task = await prismaClient.task.findFirst({
        where: workerOpenTaskWhere(userId, workerAddress, { id: taskId }),
        select: taskDetailSelect,
    });

    if (!task) {
        return null;
    }

    await markServed(userId, task.id);
    return formatTaskDetail(task);
}
