import { prismaClient } from "db/client";
import { env } from "../src/env";
import { quotedPriceFor } from "../src/economics";
import { DEMO_CREATOR_ADDRESS, seedDemo } from "./seed-demo";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type StatsBody = {
  votes: number;
  uniqueValidators: number;
  leaderboard: unknown[];
  targets: { votes: number; uniqueValidators: number; uniqueCreators: number; underFiveMinutesRate: number };
  pilot: {
    votes: number;
    uniqueValidators: number;
    uniqueCreators: number;
    tasks: number;
    tasksDone: number;
  };
};

async function fetchStats(): Promise<StatsBody> {
  const res = await fetch(`${API}/api/v1/stats`);
  assert(res.status === 200, `stats HTTP ${res.status}`);
  return res.json() as Promise<StatsBody>;
}

async function main() {
  await seedDemo();

  const afterSeed = await fetchStats();
  assert(afterSeed.targets.votes === 10_000, `targets.votes ${afterSeed.targets.votes}`);
  assert(afterSeed.targets.uniqueValidators === 500, "targets.uniqueValidators");
  assert(afterSeed.targets.uniqueCreators === 5, "targets.uniqueCreators");
  assert(afterSeed.uniqueValidators >= 0, "phase10 uniqueValidators missing");
  assert(Array.isArray(afterSeed.leaderboard), "phase10 leaderboard missing");

  const demoCounted = await prismaClient.user.count({
    where: {
      address: DEMO_CREATOR_ADDRESS,
      tasks: { some: {} },
    },
  });
  assert(demoCounted === 1, "demo creator should exist after seed");
  const expectedCreators = await prismaClient.user.count({
    where: {
      address: { not: DEMO_CREATOR_ADDRESS },
      tasks: { some: { NOT: { signature: { startsWith: "demo-seed-" } } } },
    },
  });
  assert(
    afterSeed.pilot.uniqueCreators === expectedCreators,
    `demo creator must not count in pilot uniqueCreators (got ${afterSeed.pilot.uniqueCreators}, expected ${expectedCreators})`,
  );

  const creator = await prismaClient.user.create({
    data: { address: `Phase11creator${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44) },
  });
  const workers = await Promise.all([
    prismaClient.worker.create({
      data: {
        address: `Phase11w0${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44),
        pending_amount: 0,
        locked_amount: 0,
      },
    }),
    prismaClient.worker.create({
      data: {
        address: `Phase11w1${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44),
        pending_amount: 0,
        locked_amount: 0,
      },
    }),
  ]);

  const started = new Date(Date.now() - 60_000);
  const task = await prismaClient.task.create({
    data: {
      title: "phase11-pilot",
      user_id: creator.id,
      signature: `p11-task-${stamp}`,
      amount: await quotedPriceFor(2),
      required_submissions: 2,
      done: true,
      options: {
        create: [
          { image_url: "https://example.com/phase11-a.png" },
          { image_url: "https://example.com/phase11-b.png" },
        ],
      },
    },
    include: { options: true },
  });
  const optionA = task.options[0]!;
  await prismaClient.task.update({
    where: { id: task.id },
    data: { winner_option_id: optionA.id },
  });
  await prismaClient.taskServe.createMany({
    data: workers.map((worker) => ({
      worker_id: worker.id,
      task_id: task.id,
      served_at: started,
    })),
  });
  await prismaClient.submission.create({
    data: {
      worker_id: workers[0]!.id,
      option_id: optionA.id,
      task_id: task.id,
      amount: 1_000_000,
      created_at: new Date(started.getTime() + 20_000),
    },
  });
  await prismaClient.submission.create({
    data: {
      worker_id: workers[1]!.id,
      option_id: task.options[1]!.id,
      task_id: task.id,
      amount: 1_000_000,
      created_at: new Date(started.getTime() + 40_000),
    },
  });

  const afterPilot = await fetchStats();
  assert(
    afterPilot.pilot.uniqueCreators === afterSeed.pilot.uniqueCreators + 1,
    `uniqueCreators should increment (was ${afterSeed.pilot.uniqueCreators}, now ${afterPilot.pilot.uniqueCreators})`,
  );
  assert(
    afterPilot.pilot.votes === afterSeed.pilot.votes + 2,
    `pilot.votes should increment by 2 (was ${afterSeed.pilot.votes}, now ${afterPilot.pilot.votes})`,
  );
  assert(afterPilot.votes >= afterPilot.pilot.votes, "all-activity votes should be >= pilot votes");

  const snapshot = Bun.spawnSync(["bun", "scripts/kpi-snapshot.ts"], {
    cwd: `${import.meta.dir}/..`,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });
  assert(snapshot.exitCode === 0, `kpi-snapshot exit ${snapshot.exitCode} ${snapshot.stderr.toString()}`);
  const parsed = JSON.parse(snapshot.stdout.toString()) as {
    capturedAt?: string;
    targets?: { votes: number };
    pilot?: { uniqueCreators: number };
    uniqueValidators?: number;
    leaderboard?: unknown;
  };
  assert(typeof parsed.capturedAt === "string", "snapshot should include capturedAt");
  assert(parsed.targets?.votes === 10_000, "snapshot targets.votes");
  assert(typeof parsed.pilot?.uniqueCreators === "number", "snapshot pilot.uniqueCreators");
  assert(typeof parsed.uniqueValidators === "number", "snapshot keeps phase10 uniqueValidators");
  assert(Array.isArray(parsed.leaderboard), "snapshot keeps phase10 leaderboard");

  console.log("ok phase11 pilot kpis");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
