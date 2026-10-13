import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts, try again shortly" },
});

export const submissionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    if (typeof req.userId === "number") {
      return `worker:${req.userId}`;
    }
    return ipKeyGenerator(req.ip ?? "unknown");
  },
  message: { error: "Too many submissions, try again shortly" },
});

export const presignRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many upload requests, try again shortly" },
});

export const exportRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    if (typeof req.userId === "number") {
      return `export:${req.userId}`;
    }
    return ipKeyGenerator(req.ip ?? "unknown");
  },
  message: { error: "Too many export requests, try again shortly" },
});

export const payoutRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many payout requests, try again shortly" },
});
