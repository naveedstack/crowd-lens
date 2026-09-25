import type { Response } from "express";

export class HttpError extends Error {
  constructor(
    public status: number,
    public error: string,
    public details?: unknown,
  ) {
    super(error);
    this.name = "HttpError";
  }
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  details?: unknown,
) {
  if (details !== undefined) {
    res.status(status).json({ error, details });
    return;
  }
  res.status(status).json({ error });
}

export function isUniqueConstraintError(err: unknown): boolean {
  return Boolean(
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002",
  );
}
