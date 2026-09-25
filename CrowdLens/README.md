# CrowdLens

Decentralized thumbnail or caption feedback: creators pay in SOL, validators vote, custodial payouts on **Solana devnet**.

Grant MVP is Phases 0–6 (this repo). Lens AI and compressed NFTs are explicitly out of scope.

## Live demo

| Surface | URL |
| --- | --- |
| Creator app | _after Vercel deploy_ |
| Worker / validator app | _after Vercel deploy_ |
| API health | `GET <api>/health` → `{ "ok": true }` |

📽️ **Demo video:** _paste link after recording_

Shot list:

1. Phantom on **devnet**, faucet if the wallet is empty
2. Worker app: connect, vote on a seeded demo task (optional comment)
3. Creator app: upload two images, pick a batch, pay, see the task on the list
4. Worker: vote on that task, open Earnings, withdraw, open the explorer

## How it works

```
Creator Next.js  ──┐
                   ├──  Express API  ──  Postgres (Prisma)
Worker Next.js   ──┘         │
                             ├──  S3 (presigned image upload)
                             └──  Solana devnet (pay-in + custodial pay-out, optional PDA escrow)
```

- **Creator** (`apps/frontend`, port 3000): landing, task list, create/pay, results, export votes as CSV/JSON.
- **Worker** (`apps/worker-frontend`, port 3001): vote, skip, history, earnings/withdraw.
- **API** (`apps/api`, port 8080): nonce JWT auth, tasks, votes, custodial treasury.
- Payouts default to **custodial** (server signs from `TREASURY_SECRET_KEY`). Set `SETTLEMENT_MODE=onchain` after deploying the Anchor program in [`anchor/`](anchor/) to escrow task funds in a PDA.

## Economics (devnet)

- **1_000_000 lamports (0.001 SOL) per vote**
- Creator batch sizes: **1, 5, 20, 50, 100** votes (price = batch × 0.001 SOL)
- Minimum worker withdraw: **0.001 SOL**
- Network: **devnet only** — faucet: https://faucet.solana.com

## Local

See [`apps/api/.env.example`](apps/api/.env.example) and the frontend `.env.example` files. Postgres: [`docker-compose.yml`](docker-compose.yml) on port 5433.

```bash
bun install
bun run db:migrate
bun run --filter=api dev
bun run --filter=frontend dev
bun run --filter=worker-frontend dev
```

Optional demo queue: `cd apps/api && bun scripts/seed-demo.ts`

Production deploy: [`DEPLOY.md`](DEPLOY.md). Creator pilot runbook: [`PILOT.md`](PILOT.md). Live KPI progress: creator app `/stats`.

## Roadmap

- **Done:** Phase 0 real stack · 1 auth · 2 task lifecycle · 3 custodial payouts · 4 worker dashboard · 5 creator dashboard · 6 deploy + public demo seed · 7 reputation / anti-sybil · 8 Anchor settlement (flagged)
- **Post-MVP:** 9 text tasks · 10 analytics export · 11 creator pilot KPIs

## KPIs (progress vs target)

- 10,000+ votes · 500+ unique validators · 3–5 creator batches · under 5 min average turnaround
- Live meters (excluding the demo seed): `/stats`. Snapshot: `cd apps/api && bun scripts/kpi-snapshot.ts`
