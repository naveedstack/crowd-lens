import { prismaClient } from "db/client";
import { platformStats } from "../src/analytics";

async function main() {
  const stats = await platformStats();
  const payload = {
    capturedAt: new Date().toISOString(),
    ...stats,
  };
  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
