import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const DEFAULT_TREASURY = "5tm9oN2bpTxFdELx9ddcxjFG9HD4NQHdkdz3CYm25EQj";

const envSchema = z.object({
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  WORKER_JWT_SECRET: z.string().min(1, "WORKER_JWT_SECRET is required"),
  RPC_URL: z.string().url("RPC_URL must be a valid URL"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  S3_BUCKET_NAME: z.string().min(1, "S3_BUCKET_NAME is required"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  TREASURY_ADDRESS: z
    .string()
    .default(DEFAULT_TREASURY)
    .refine((value) => {
      try {
        new PublicKey(value);
        return true;
      } catch {
        return false;
      }
    }, "TREASURY_ADDRESS must be a valid Solana address"),
  LAMPORTS_PER_VOTE: z.coerce.number().int().positive().default(1_000_000),
  SOL_USD_FALLBACK: z.coerce.number().positive().default(120),
  PRICE_QUOTE_TOLERANCE: z.coerce.number().min(0).max(1).default(0.15),
  TASK_MIN_VOTES: z.coerce.number().int().min(1).default(1),
  TASK_MAX_VOTES: z.coerce.number().int().min(1).default(100),
  TREASURY_SECRET_KEY: z
    .string()
    .min(1, "TREASURY_SECRET_KEY is required")
    .transform((raw, ctx) => {
      try {
        const parsedKey = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsedKey) || parsedKey.length < 32) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "TREASURY_SECRET_KEY must be a JSON byte array",
          });
          return z.NEVER;
        }
        if (!parsedKey.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "TREASURY_SECRET_KEY bytes must be 0-255",
          });
          return z.NEVER;
        }
        return Uint8Array.from(parsedKey);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TREASURY_SECRET_KEY must be valid JSON",
        });
        return z.NEVER;
      }
    }),
  WALLET_MIN_SIGNATURES: z.coerce.number().int().min(0).default(0),
  EXPORT_SALT: z.string().optional(),
  SETTLEMENT_MODE: z.enum(["custodial", "onchain"]).default("custodial"),
  CROWDLENS_PROGRAM_ID: z
    .string()
    .default("4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4")
    .refine((value) => {
      try {
        new PublicKey(value);
        return true;
      } catch {
        return false;
      }
    }, "CROWDLENS_PROGRAM_ID must be a valid Solana address"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.TASK_MAX_VOTES < parsed.data.TASK_MIN_VOTES) {
  console.error("TASK_MAX_VOTES must be greater than or equal to TASK_MIN_VOTES");
  process.exit(1);
}

export const env = parsed.data;
