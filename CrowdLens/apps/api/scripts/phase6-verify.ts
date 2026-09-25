import jwt from "jsonwebtoken";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { getNextTask } from "../src/db";
import { DEMO_CREATOR_ADDRESS, DEMO_SIGNATURE_PREFIX, seedDemo } from "./seed-demo";

const API = `http://localhost:${env.PORT}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const health = await fetch(`${API}/health`);
  assert(health.status === 200, `health HTTP ${health.status}`);
  const healthBody = await health.json() as { ok?: boolean };
  assert(healthBody.ok === true, "health should report ok");

  const first = await seedDemo();
  const second = await seedDemo();
  assert(second.skipped || second.created === 0, "second seed should not create extra demo tasks");

  const openDemo = await prismaClient.task.count({
    where: {
      user_id: first.creatorId,
      done: false,
      signature: { startsWith: DEMO_SIGNATURE_PREFIX },
    },
  });
  assert(openDemo === 4, `expected 4 open demo tasks, got ${openDemo}`);

  const worker = await prismaClient.worker.create({
    data: {
      address: `Phase6voter${Date.now()}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44),
      pending_amount: 0,
      locked_amount: 0,
    },
  });
  assert(worker.address !== DEMO_CREATOR_ADDRESS, "voter must not be the demo creator");

  const token = jwt.sign(
    { id: worker.id, address: worker.address },
    env.WORKER_JWT_SECRET,
    { expiresIn: "24h" },
  );

  const next = await fetch(`${API}/api/v1/worker/nextTask`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(next.status === 200, `nextTask HTTP ${next.status}`);
  const body = await next.json() as { task: { id: number; title: string } | null };
  if (body.task) {
    const served = await prismaClient.task.findUnique({ where: { id: body.task.id } });
    assert(served, "served task should exist");
    assert(
      !served.signature.startsWith(DEMO_SIGNATURE_PREFIX),
      "worker queue must not serve seeded demo tasks",
    );
    assert(served.user_id !== first.creatorId, "worker queue must not serve the demo creator");
  }

  const liveOpen = await prismaClient.task.findMany({
    where: {
      done: false,
      NOT: { signature: { startsWith: DEMO_SIGNATURE_PREFIX } },
      user: { address: { not: DEMO_CREATOR_ADDRESS } },
    },
    select: { id: true },
  });
  const demoOnly = await getNextTask(
    worker.id,
    worker.address,
    liveOpen.map((row) => row.id),
  );
  assert(demoOnly == null, "seeded demo tasks must not fill the worker queue");

  console.log("ok phase6 health + seed + nextTask");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
