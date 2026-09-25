import { env } from "./env";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import userRouter from "./routers/user";
import workerRouter from "./routers/worker";
import cors from "cors";
import { prismaClient } from "db/client";
import { HttpError, sendError } from "./http";
import { platformStats } from "./analytics";
import { reconcileProcessingPayouts } from "./payouts/engine";
import { reconcileEscrowSettles } from "./solana/escrow";

const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
    if (req.path === "/health") {
        next();
        return;
    }
    const started = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
});

app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        return next();
    }
    return express.json()(req, res, next);
});

const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(cors({
    origin: corsOrigins,
    credentials: true,
}));

app.get("/health", async (_req, res) => {
    try {
        await prismaClient.$queryRaw`SELECT 1`;
        res.json({ ok: true });
    } catch (err) {
        console.error("health check failed", err);
        res.status(503).json({ ok: false });
    }
});

app.get("/", (_req, res) => {
    res.send(`API server running on http://localhost:${env.PORT}`);
});
 
app.get("/api/v1/stats", async (_req, res, next) => {
    try {
        res.json(await platformStats());
    } catch (err) {
        next(err);
    }
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/worker", workerRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        sendError(res, err.status, err.error, err.details);
        return;
    }

    if (err instanceof SyntaxError) {
        sendError(res, 400, "Invalid JSON");
        return;
    }

    console.error(err);
    sendError(res, 500, "Internal server error");
});

async function start() {
    try {
        await reconcileProcessingPayouts();
        await reconcileEscrowSettles();
    } catch (err) {
        console.error("Payout reconcile failed", err);
    }

    app.listen(env.PORT, () => {
        console.log(`API server running on http://localhost:${env.PORT}`);
    });
}

start();
