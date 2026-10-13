import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient({
  transactionOptions: {
    maxWait: 10_000,
    timeout: 20_000,
  },
});
