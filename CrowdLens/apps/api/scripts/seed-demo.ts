import { prismaClient } from "db/client";
import { priceFor } from "../src/economics";

/** Throwaway address so a tester's Phantom is never the task creator. */
export const DEMO_CREATOR_ADDRESS = "CrowdLensDemoCreatorDoNotUse111111111111";
export const DEMO_SIGNATURE_PREFIX = "demo-seed-";

const PEXELS = [
  "https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg",
  "https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg",
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg",
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
];

const DEMO_TASKS = [
  {
    signature: `${DEMO_SIGNATURE_PREFIX}1`,
    title: "Demo: Choose the best thumbnail",
    options: [PEXELS[0], PEXELS[1], PEXELS[2]],
  },
  {
    signature: `${DEMO_SIGNATURE_PREFIX}2`,
    title: "Demo: Which image looks more authentic?",
    options: [PEXELS[3], PEXELS[0]],
  },
  {
    signature: `${DEMO_SIGNATURE_PREFIX}3`,
    title: "Demo: Pick the stronger YouTube thumbnail",
    options: [PEXELS[1], PEXELS[2], PEXELS[3], PEXELS[0]],
  },
  {
    signature: `${DEMO_SIGNATURE_PREFIX}4`,
    title: "Demo: Which image would you click?",
    options: [PEXELS[2], PEXELS[3], PEXELS[1]],
  },
];

export async function seedDemo() {
  const creator = await prismaClient.user.upsert({
    where: { address: DEMO_CREATOR_ADDRESS },
    update: {},
    create: { address: DEMO_CREATOR_ADDRESS },
  });

  const existingOpen = await prismaClient.task.count({
    where: {
      user_id: creator.id,
      done: false,
      signature: { startsWith: DEMO_SIGNATURE_PREFIX },
    },
  });

  if (existingOpen >= DEMO_TASKS.length) {
    return { creatorId: creator.id, created: 0, skipped: true };
  }

  const requiredSubmissions = 5;
  const amount = priceFor(requiredSubmissions);
  let created = 0;

  for (const demo of DEMO_TASKS) {
    const already = await prismaClient.task.findUnique({
      where: { signature: demo.signature },
    });
    if (already) {
      continue;
    }
    await prismaClient.task.create({
      data: {
        title: demo.title,
        user_id: creator.id,
        signature: demo.signature,
        amount,
        required_submissions: requiredSubmissions,
        options: {
          create: demo.options.map((image_url) => ({ image_url })),
        },
      },
    });
    created += 1;
  }

  return { creatorId: creator.id, created, skipped: false };
}

async function main() {
  const result = await seedDemo();
  if (result.skipped) {
    console.log("ok seed-demo skipped, open demo tasks already exist");
    return;
  }
  console.log(`ok seed-demo created ${result.created} tasks for user ${result.creatorId}`);
}

if (import.meta.main) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
}
