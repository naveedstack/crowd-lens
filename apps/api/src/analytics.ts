import { createHash } from "node:crypto";
import { prismaClient } from "db/client";
import { DEMO_CREATOR_ADDRESS, DEMO_SIGNATURE_PREFIX } from "../scripts/seed-demo";
import { env } from "./env";

export const KPI_TARGETS = {
  votes: 10_000,
  uniqueValidators: 500,
  uniqueCreators: 5,
  underFiveMinutesRate: 1,
} as const;

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const HASH_LENGTH = 16;

export type TimelineBucket = {
  start: string;
  counts: Record<string, number>;
};

export type TaskAnalytics = {
  completionRate: number;
  submissionCount: number;
  requiredSubmissions: number;
  startedAt: string | null;
  completedAt: string | null;
  turnaroundMs: number | null;
  underFiveMinutes: boolean | null;
  timeline: TimelineBucket[];
};

export type PlatformLeaderboardRow = {
  rank: number;
  addressPreview: string;
  reputation: number;
  alignedVotes: number;
  votes: number;
};

export type KpiTargets = {
  votes: number;
  uniqueValidators: number;
  uniqueCreators: number;
  underFiveMinutesRate: number;
};

export type PilotStats = {
  votes: number;
  uniqueValidators: number;
  uniqueCreators: number;
  tasks: number;
  tasksDone: number;
  avgTurnaroundMs: number | null;
  underFiveMinutesRate: number | null;
};

export type PlatformStats = {
  votes: number;
  uniqueValidators: number;
  tasks: number;
  tasksDone: number;
  avgTurnaroundMs: number | null;
  underFiveMinutesRate: number | null;
  leaderboard: PlatformLeaderboardRow[];
  targets: KpiTargets;
  pilot: PilotStats;
};

export type ExportRow = {
  task_id: number;
  title: string | null;
  done: boolean;
  winner_option_id: number | null;
  option_id: number;
  option_type: string;
  image_url: string;
  content: string;
  comment: string | null;
  created_at: string;
  worker_hash: string;
};

function exportSalt(): string {
  const salt = env.EXPORT_SALT?.trim();
  return salt && salt.length > 0 ? salt : env.JWT_SECRET;
}

export function anonymizeWorkerId(workerId: number): string {
  return createHash("sha256")
    .update(`${exportSalt()}:${workerId}`)
    .digest("hex")
    .slice(0, HASH_LENGTH);
}

export function addressPreview(address: string): string {
  if (address.length <= 8) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function floorToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
}

export function computeTaskAnalytics(args: {
  done: boolean;
  requiredSubmissions: number;
  votes: Array<{ option_id: number; created_at: Date }>;
  servedAt: Date[];
}): TaskAnalytics {
  const submissionCount = args.votes.length;
  const requiredSubmissions = args.requiredSubmissions;
  const completionRate =
    requiredSubmissions > 0 ? submissionCount / requiredSubmissions : 0;

  const voteTimes = args.votes.map((vote) => vote.created_at.getTime());
  const serveTimes = args.servedAt.map((served) => served.getTime());
  const startedMs =
    serveTimes.length > 0
      ? Math.min(...serveTimes)
      : voteTimes.length > 0
        ? Math.min(...voteTimes)
        : null;
  const completedMs = args.done && voteTimes.length > 0 ? Math.max(...voteTimes) : null;
  const turnaroundMs =
    args.done && startedMs != null && completedMs != null ? completedMs - startedMs : null;

  const buckets = new Map<string, Record<string, number>>();
  for (const vote of args.votes) {
    const start = floorToMinute(vote.created_at).toISOString();
    const counts = buckets.get(start) ?? {};
    const key = String(vote.option_id);
    counts[key] = (counts[key] ?? 0) + 1;
    buckets.set(start, counts);
  }
  const timeline = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, counts]) => ({ start, counts }));

  return {
    completionRate,
    submissionCount,
    requiredSubmissions,
    startedAt: startedMs != null ? new Date(startedMs).toISOString() : null,
    completedAt: completedMs != null ? new Date(completedMs).toISOString() : null,
    turnaroundMs,
    underFiveMinutes: turnaroundMs == null ? null : turnaroundMs < FIVE_MINUTES_MS,
    timeline,
  };
}

export async function taskAnalytics(taskId: number): Promise<TaskAnalytics | null> {
  const task = await prismaClient.task.findUnique({
    where: { id: taskId },
    select: {
      done: true,
      required_submissions: true,
      submissions: {
        select: { option_id: true, created_at: true },
        orderBy: { created_at: "asc" },
      },
      taskServes: {
        select: { served_at: true },
      },
    },
  });
  if (!task) {
    return null;
  }
  return computeTaskAnalytics({
    done: task.done,
    requiredSubmissions: task.required_submissions,
    votes: task.submissions,
    servedAt: task.taskServes.map((serve) => serve.served_at),
  });
}

const pilotTaskWhere = {
  user: { address: { not: DEMO_CREATOR_ADDRESS } },
  NOT: { signature: { startsWith: DEMO_SIGNATURE_PREFIX } },
};

function turnaroundForTask(task: {
  submissions: Array<{ created_at: Date }>;
  taskServes: Array<{ served_at: Date }>;
}): number | null {
  if (task.submissions.length === 0) {
    return null;
  }
  const voteTimes = task.submissions.map((vote) => vote.created_at.getTime());
  const serveTimes = task.taskServes.map((serve) => serve.served_at.getTime());
  const startedMs =
    serveTimes.length > 0 ? Math.min(...serveTimes) : Math.min(...voteTimes);
  const completedMs = Math.max(...voteTimes);
  return completedMs - startedMs;
}

function summarizeTurnarounds(
  tasks: Array<{
    submissions: Array<{ created_at: Date }>;
    taskServes: Array<{ served_at: Date }>;
  }>,
): { avgTurnaroundMs: number | null; underFiveMinutesRate: number | null } {
  const turnarounds = tasks
    .map(turnaroundForTask)
    .filter((value): value is number => value != null);
  return {
    avgTurnaroundMs:
      turnarounds.length > 0
        ? Math.round(turnarounds.reduce((sum, value) => sum + value, 0) / turnarounds.length)
        : null,
    underFiveMinutesRate:
      turnarounds.length > 0
        ? turnarounds.filter((value) => value < FIVE_MINUTES_MS).length / turnarounds.length
        : null,
  };
}

export async function platformStats(): Promise<PlatformStats> {
  const [
    votes,
    uniqueValidators,
    tasks,
    tasksDone,
    doneTasks,
    leaderboardRows,
    pilotVotes,
    pilotValidators,
    uniqueCreators,
    pilotTasks,
    pilotTasksDone,
    pilotDoneTasks,
  ] = await Promise.all([
    prismaClient.submission.count(),
    prismaClient.worker.count({
      where: { submissions: { some: {} } },
    }),
    prismaClient.task.count(),
    prismaClient.task.count({ where: { done: true } }),
    prismaClient.task.findMany({
      where: { done: true },
      select: {
        submissions: { select: { created_at: true } },
        taskServes: { select: { served_at: true } },
      },
    }),
    prismaClient.worker.findMany({
      where: { submissions: { some: {} } },
      orderBy: [{ aligned_votes: "desc" }, { reputation: "desc" }],
      take: 20,
      select: {
        address: true,
        reputation: true,
        aligned_votes: true,
        _count: { select: { submissions: true } },
      },
    }),
    prismaClient.submission.count({
      where: { task: pilotTaskWhere },
    }),
    prismaClient.worker.count({
      where: { submissions: { some: { task: pilotTaskWhere } } },
    }),
    prismaClient.user.count({
      where: {
        address: { not: DEMO_CREATOR_ADDRESS },
        tasks: {
          some: {
            NOT: { signature: { startsWith: DEMO_SIGNATURE_PREFIX } },
          },
        },
      },
    }),
    prismaClient.task.count({ where: pilotTaskWhere }),
    prismaClient.task.count({ where: { ...pilotTaskWhere, done: true } }),
    prismaClient.task.findMany({
      where: { ...pilotTaskWhere, done: true },
      select: {
        submissions: { select: { created_at: true } },
        taskServes: { select: { served_at: true } },
      },
    }),
  ]);

  const all = summarizeTurnarounds(doneTasks);
  const pilotTurnaround = summarizeTurnarounds(pilotDoneTasks);

  return {
    votes,
    uniqueValidators,
    tasks,
    tasksDone,
    avgTurnaroundMs: all.avgTurnaroundMs,
    underFiveMinutesRate: all.underFiveMinutesRate,
    leaderboard: leaderboardRows.map((row, index) => ({
      rank: index + 1,
      addressPreview: addressPreview(row.address),
      reputation: row.reputation,
      alignedVotes: row.aligned_votes,
      votes: row._count.submissions,
    })),
    targets: { ...KPI_TARGETS },
    pilot: {
      votes: pilotVotes,
      uniqueValidators: pilotValidators,
      uniqueCreators,
      tasks: pilotTasks,
      tasksDone: pilotTasksDone,
      avgTurnaroundMs: pilotTurnaround.avgTurnaroundMs,
      underFiveMinutesRate: pilotTurnaround.underFiveMinutesRate,
    },
  };
}

export async function exportTaskVotes(taskId: number): Promise<ExportRow[] | null> {
  const task = await prismaClient.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      done: true,
      winner_option_id: true,
      submissions: {
        orderBy: { created_at: "asc" },
        select: {
          option_id: true,
          comment: true,
          created_at: true,
          worker_id: true,
          option: {
            select: {
              type: true,
              image_url: true,
              content: true,
            },
          },
        },
      },
    },
  });
  if (!task) {
    return null;
  }

  return task.submissions.map((submission) => ({
    task_id: task.id,
    title: task.title,
    done: task.done,
    winner_option_id: task.winner_option_id,
    option_id: submission.option_id,
    option_type: submission.option.type,
    image_url: submission.option.image_url,
    content: submission.option.content,
    comment: submission.comment,
    created_at: submission.created_at.toISOString(),
    worker_hash: anonymizeWorkerId(submission.worker_id),
  }));
}

function csvValue(value: string | number | boolean | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const EXPORT_COLUMNS: Array<keyof ExportRow> = [
  "task_id",
  "title",
  "done",
  "winner_option_id",
  "option_id",
  "option_type",
  "image_url",
  "content",
  "comment",
  "created_at",
  "worker_hash",
];

export function exportRowsToCsv(rows: ExportRow[]): string {
  const header = EXPORT_COLUMNS.join(",");
  const body = rows.map((row) => EXPORT_COLUMNS.map((column) => csvValue(row[column])).join(","));
  return [header, ...body].join("\n");
}
