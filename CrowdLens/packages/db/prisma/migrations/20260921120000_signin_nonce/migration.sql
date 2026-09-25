-- CreateEnum
CREATE TYPE "SignInRole" AS ENUM ('User', 'Worker');

-- CreateTable
CREATE TABLE "SignInNonce" (
    "id" SERIAL NOT NULL,
    "nonce" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "role" "SignInRole" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignInNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignInNonce_nonce_key" ON "SignInNonce"("nonce");

-- CreateIndex
CREATE INDEX "SignInNonce_address_idx" ON "SignInNonce"("address");
