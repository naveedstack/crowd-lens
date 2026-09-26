# Deploy CrowdLens (devnet)

Grant reviewers need one public Next app and one API. Network is **Solana devnet only**. Do not commit secrets.

Repo root for these files is `CrowdLens/`.

## 1. Postgres + API (Render)

1. Create a Blueprint from [`render.yaml`](render.yaml), or a Docker web service with this Dockerfile and a Postgres 16 instance.
2. Set `DATABASE_URL` from the Render database.
3. Fill the `sync: false` env vars from [`apps/api/.env.example`](apps/api/.env.example).
4. `CORS_ORIGIN` must be the Vercel origin, **no trailing slash**:
   `https://<app>.vercel.app`
5. Confirm `GET https://<api>/health` returns `{ "ok": true }`.
6. From a machine with `DATABASE_URL` pointing at Render Postgres:

```bash
cd apps/api
bun scripts/seed-demo.ts
```

The API container already runs `prisma migrate deploy` on boot.

## 2. Frontend (Vercel)

Create **one** project. Root directory: `apps/frontend` (port 3000 locally).

Landing is `/`. Creators use `/creator`. Voters use `/voter`.

Env:

- `NEXT_PUBLIC_BACKEND_URL` — Render API origin, no trailing slash (e.g. `https://crowdlens-api.onrender.com`)
- `NEXT_PUBLIC_CLOUDFRONT_URL` — public S3 base (`https://crowd-lens-mvp.s3.ap-south-1.amazonaws.com`)

Redeploy after env changes so `NEXT_PUBLIC_*` is baked in.

## 3. S3 CORS

Presigned POST uploads run in the **browser**. On bucket `crowd-lens-mvp`, allow the Vercel origin:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": [
      "https://<app>.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Local `http://localhost:3000` can stay in the same policy while developing.

## 4. Treasury

Withdrawals send SOL from `TREASURY_SECRET_KEY` on **devnet**. Airdrop that wallet enough SOL that a $0.50 voter payout plus fees succeeds (`https://faucet.solana.com`).

Keep a treasury airdrop only as fee payer / oracle signer. Do not switch this on mainnet.

## 5. Smoke test

1. Open `/voter`, set Phantom to **devnet**, faucet if needed, connect, vote on a seeded demo task.
2. Open `/creator`, connect a **different** wallet, create a 2-image task, pay **$1 in SOL** (1 vote) or more.
3. The first wallet should then be able to vote on that new task (not its own).
4. Voter **Withdraw** should land a devnet tx on the explorer.

## 6. On-chain escrow (optional, Phase 8)

Default is still **custodial** (`SETTLEMENT_MODE=custodial`). To pay validators from a task PDA instead of `TREASURY_SECRET_KEY`:

1. From `CrowdLens/anchor`: copy `keys/crowdlens-keypair.json` to `target/deploy/crowdlens-keypair.json`, then `NO_DNA=1 anchor deploy --provider.cluster devnet`.
2. Initialize config (authority = treasury wallet): `cd apps/api && bun scripts/init-crowdlens-program.ts`
3. Set API env:
   - `SETTLEMENT_MODE=onchain`
   - `CROWDLENS_PROGRAM_ID=4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4`
4. Creator pay-in builds `create_task`. Worker votes stay off-chain; close sends `commit_votes` + `settle_chunk` from the API.

Keep a treasury airdrop only as fee payer / oracle signer. Do not switch this on mainnet.
