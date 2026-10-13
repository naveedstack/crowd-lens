import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response } from "express";
import { HttpError, sendError } from "../http";

const JWT_EXPIRES_IN = "24h";

function readBearer(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

/** Issue a role token from a live session of the other role. No second wallet signature. */
export async function issueTokenFromPeerSession(
  req: Request,
  res: Response,
  peerSecret: string,
  issueSecret: string,
  issueIdentity: (address: string) => Promise<{ id: number; address: string }>,
) {
  const token = readBearer(req);
  if (!token) {
    sendError(res, 401, "Unauthorized");
    return;
  }

  let address: string;
  try {
    const decoded = jwt.verify(token, peerSecret);
    if (typeof decoded === "string") {
      sendError(res, 401, "Unauthorized");
      return;
    }
    const payload = decoded as JwtPayload & { address?: unknown };
    if (typeof payload.address !== "string") {
      sendError(res, 401, "Unauthorized");
      return;
    }
    address = payload.address;
  } catch {
    sendError(res, 401, "Unauthorized");
    return;
  }

  let identity: { id: number; address: string };
  try {
    identity = await issueIdentity(address);
  } catch (err) {
    if (err instanceof HttpError) {
      sendError(res, err.status, err.error, err.details);
      return;
    }
    throw err;
  }

  res.json({
    token: jwt.sign(
      { id: identity.id, address: identity.address },
      issueSecret,
      { expiresIn: JWT_EXPIRES_IN },
    ),
  });
}
