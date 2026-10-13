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
  return prismaCode(err) === "P2002";
}

export function isTransactionGoneError(err: unknown): boolean {
  return prismaCode(err) === "P2028";
}

function prismaCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("code" in err)) {
    return undefined;
  }
  const code = (err as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}
