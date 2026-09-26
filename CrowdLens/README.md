# CrowdLens

Decentralized thumbnail or caption feedback: creators pay in SOL, validators vote, custodial payouts on **Solana devnet**.

Grant MVP is Phases 0–6 (this repo). Lens AI and compressed NFTs are explicitly out of scope.

## Live demo

| Surface | URL |
| --- | --- |
| App | _after Vercel deploy_ (`/` landing, `/creator`, `/voter`) |
| API health | `GET <api>/health` → `{ "ok": true }` |

📽️ **Demo video:** _paste link after recording_

Shot list:

1. Phantom on **devnet**, faucet if the wallet is empty
2. `/voter`: connect, vote on a seeded demo task (optional comment)
3. `/creator`: upload two images, pick a batch, pay, see the task on the list
4. `/voter`: vote on that task, open Earnings, withdraw, open the explorer

## How it works

```
Next.js (`/` `/creator` `/voter`)  ──  Express API  ──  Postgres (Prisma)
                                           │
                                           ├──  S3 (presigned image upload)
                                           └──  Solana devnet (pay-in + custodial pay-out, optional PDA escrow)
```

- **App** (`apps/frontend`, port 3000): landing, creator tasks at `/creator`, voter queue at `/voter`.
- **API** (`apps/api`, port 8080): nonce JWT auth, tasks, votes, custodial treasury.
- Payouts default to **custodial** (server signs from `TREASURY_SECRET_KEY`). Set `SETTLEMENT_MODE=onchain` after deploying the Anchor program in [`anchor/`](anchor/) to escrow task funds in a PDA.

## Economics (devnet)

- Creators pay **$1 per vote**, voters earn **$0.50 per vote**, converted to SOL at the live rate
- Vote count is adjustable (**1–100** by default)
- Minimum worker withdraw: **one vote payout ($0.50 in SOL)**
- Network: **devnet only** — faucet: https://faucet.solana.com

## Local

See [`apps/api/.env.example`](apps/api/.env.example) and [`apps/frontend/.env.example`](apps/frontend/.env.example). Postgres: [`docker-compose.yml`](docker-compose.yml) on port 5433.

```bash
bun install
bun run db:migrate
bun run --filter=api dev
bun run --filter=frontend dev
```

Optional demo queue: `cd apps/api && bun scripts/seed-demo.ts`

Production deploy: [`DEPLOY.md`](DEPLOY.md). Creator pilot runbook: [`PILOT.md`](PILOT.md). Live KPI progress: `/stats`.

## Roadmap

- **Done:** Phase 0 real stack · 1 auth · 2 task lifecycle · 3 custodial payouts · 4 worker dashboard · 5 creator dashboard · 6 deploy + public demo seed · 7 reputation / anti-sybil · 8 Anchor settlement (flagged)
- **Post-MVP:** 9 text tasks · 10 analytics export · 11 creator pilot KPIs

## KPIs (progress vs target)

- 10,000+ votes · 500+ unique validators · 3–5 creator batches · under 5 min average turnaround
- Live meters (excluding the demo seed): `/stats`. Snapshot: `cd apps/api && bun scripts/kpi-snapshot.ts`
