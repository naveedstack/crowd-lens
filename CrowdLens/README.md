# CrowdLens

Started from Pratik Kale’s open-source CrowdLens MVP (https://github.com/Pratikkale26/CrowdLens); during this build we added the Anchor escrow program, on-chain commit and settlement, live USD-to-SOL pricing, and a single creator/validator app.

This demo is **https://crowdlens-bay.vercel.app**. Pratik’s public site is **https://crowdlens.kalehub.com** — they are not the same deployment.

Creators escrow SOL on **Solana Devnet**, humans vote on 2–5 images, and when the batch fills the winner is committed on-chain and aligned voters are paid from escrow. Image tasks only. Lens AI and compressed NFTs are out of scope.

## Live demo

| Surface | URL |
| --- | --- |
| App | https://crowdlens-bay.vercel.app |
| Creator | https://crowdlens-bay.vercel.app/creator |
| Validator votes | https://crowdlens-bay.vercel.app/validators/votes |
| Stats | https://crowdlens-bay.vercel.app/stats |
| API health | https://crowdlens-api.vercel.app/health |
| App health (proxies the API) | https://crowdlens-bay.vercel.app/health |

Phantom on **Devnet**. Empty wallets: https://faucet.solana.com

1. `/validators/votes`: connect, vote on a seeded demo task (optional comment)
2. `/creator`: upload two images, pick a vote count, pay, see the task on the list
3. `/validators/votes`: vote on that task from a **second** wallet, then check Earnings and Explorer

## How it works

```
Next.js (`/` `/creator` `/validators`)  ──  Express API  ──  Postgres (Prisma)
                                           │
                                           ├──  S3 (presigned image upload)
                                           └──  Solana Devnet (task PDA escrow, commit_votes, settle_chunk)
```

- **App** (`apps/frontend`, port 3000): landing `/`, validator guide `/validators`, votes `/validators/votes`, creator `/creator`.
- **API** (`apps/api`, port 8080): nonce JWT auth, tasks, votes, settlement.
- Live path is **on-chain escrow** (`SETTLEMENT_MODE=onchain`). Creator pay-in funds a task PDA; after the batch fills the API commits the winner and pays voters from escrow. Custodial treasury send remains only for leftover pending from older tasks.

## Economics (devnet)

- Creators pay **$1 per vote**, voters earn **$0.80 per vote** (80% of escrow), converted to SOL at the live rate
- Vote count is adjustable (**1–100** by default)
- Images per task: **2–5**
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

Production deploy: [`DEPLOY.md`](DEPLOY.md). Product requirements: [`docs/PRD.md`](docs/PRD.md). Creator pilot runbook: [`PILOT.md`](PILOT.md). Live KPI progress: `/stats`.

## Roadmap

- **Shipped:** auth, image tasks, worker and creator dashboards, public demo, reputation, on-chain escrow settlement, analytics export, `/stats`
- **Not in this MVP:** captions/text, Lens AI, cNFTs, DePIN nodes, mainnet (see [`docs/PRD.md`](docs/PRD.md) §14)

## KPIs (progress vs target)

- 10,000+ votes · 500+ unique validators · 3–5 creator batches · under 5 min average turnaround
- Live meters (excluding the demo seed): `/stats`. Snapshot: `cd apps/api && bun scripts/kpi-snapshot.ts`
