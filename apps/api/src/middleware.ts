import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { env } from "./env";
import { sendError } from "./http";

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

function attachIdentity(req: Request, res: Response, next: NextFunction, secret: string) {
    const token = readBearer(req);
    if (!token) {
        sendError(res, 401, "Unauthorized");
        return;
    }

    try {
        const decoded = jwt.verify(token, secret);
        if (typeof decoded === "string") {
            sendError(res, 401, "Unauthorized");
            return;
        }

        const payload = decoded as JwtPayload & { id?: unknown; address?: unknown };
        if (typeof payload.id !== "number" || typeof payload.address !== "string") {
            sendError(res, 401, "Unauthorized");
            return;
        }

        req.userId = payload.id;
        req.walletAddress = payload.address;
        next();
    } catch {
        sendError(res, 401, "Unauthorized");
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    attachIdentity(req, res, next, env.JWT_SECRET);
};

export const workerAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    attachIdentity(req, res, next, env.WORKER_JWT_SECRET);
};
