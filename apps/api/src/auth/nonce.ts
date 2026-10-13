import { prismaClient } from "db/client";
import { SignInRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import { buildSignInMessage } from "auth-message";
import { HttpError, sendError } from "../http";
import type { Request, Response } from "express";

const NONCE_TTL_MS = 5 * 60 * 1000;
const JWT_EXPIRES_IN = "24h";

function parseAddress(publicKey: unknown): string | null {
  if (typeof publicKey !== "string" || publicKey.length === 0) {
    return null;
  }
  try {
    return new PublicKey(publicKey).toBase58();
  } catch {
    return null;
  }
}

export async function issueNonce(req: Request, res: Response, role: SignInRole) {
  const address = parseAddress(req.body?.publicKey);
  if (!address) {
    sendError(res, 400, "Invalid public key");
    return;
  }

  await prismaClient.signInNonce.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });

  const nonce = uuidv4();
  await prismaClient.signInNonce.create({
    data: {
      nonce,
      address,
      role,
      expires_at: new Date(Date.now() + NONCE_TTL_MS),
    },
  });

  res.json({
    nonce,
    message: buildSignInMessage(address, nonce),
  });
}

export async function verifySignedNonce(
  req: Request,
  res: Response,
  role: SignInRole,
  jwtSecret: string,
  issueToken: (address: string) => Promise<{ id: number; address: string }>,
) {
  const address = parseAddress(req.body?.publicKey);
  const nonce = req.body?.nonce;
  const signature = req.body?.signature;

  if (!address || typeof nonce !== "string" || !Array.isArray(signature)) {
    sendError(res, 400, "Invalid sign-in payload");
    return;
  }

  const consumed = await prismaClient.signInNonce.deleteMany({
    where: {
      nonce,
      address,
      role,
      expires_at: { gt: new Date() },
    },
  });

  if (consumed.count !== 1) {
    sendError(res, 401, "Invalid or expired nonce");
    return;
  }

  const message = new TextEncoder().encode(buildSignInMessage(address, nonce));
  let valid = false;
  try {
    valid = nacl.sign.detached.verify(
      message,
      Uint8Array.from(signature),
      new PublicKey(address).toBytes(),
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    sendError(res, 401, "Invalid signature");
    return;
  }

  let identity: { id: number; address: string };
  try {
    identity = await issueToken(address);
  } catch (err) {
    if (err instanceof HttpError) {
      sendError(res, err.status, err.error, err.details);
      return;
    }
    throw err;
  }
  const token = jwt.sign(
    { id: identity.id, address: identity.address },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.json({ token });
}
