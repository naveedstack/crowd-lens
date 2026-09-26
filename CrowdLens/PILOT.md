# CrowdLens creator pilot

Grant evidence, not a feature dump. Network stays **Solana devnet**. Creators pay **$1 per vote** and voters earn **$0.50**, converted to SOL at the live rate.

Live progress vs targets: creator app `/stats`. Snapshot: `cd apps/api && bun scripts/kpi-snapshot.ts`.

## Goal

3–5 real creators, distinct from the demo wallet (`CrowdLensDemoCreatorDoNotUse111111111111`). Prefer a few votes per task so turnaround is measurable. README targets:

- 10,000+ votes
- 500+ unique validators
- 3–5 unique non-demo creators (meter max is 5)
- under 5 minutes average batch turnaround

The demo seed is excluded from **Pilot KPIs** on `/stats`. Do not treat seeded Pexels/caption tasks as pilot evidence.

## Outreach checklist

1. Confirm the app (`/`, `/creator`, `/voter`) and `GET /health` are live ([DEPLOY.md](DEPLOY.md)).
2. Ask 3–5 creators (thumbnails or captions) who can pay **$1 per vote in SOL** on **devnet** (faucet if needed).
3. They use a real Phantom wallet — not the demo creator address.
4. Create a task (a few votes is enough). Share `/voter` so validators can fill it.
5. After the batch closes: export CSV/JSON from the task page; optional CTR from their analytics.
6. Run `bun scripts/kpi-snapshot.ts` and keep the JSON with the grant folder (do not commit live dumps).

## Interview questions

- Was the winning option useful? Would you ship it?
- How long did the batch take relative to posting the task?
- Would you pay again on mainnet at a real-money price?
- Optional: CTR (or similar) before vs after swapping to the winner.

## Case studies

Paste optional CTR into [`apps/frontend/src/content/case-studies.json`](apps/frontend/src/content/case-studies.json):

```json
[
  {
    "title": "Which thumbnail for the Sept upload",
    "creatorLabel": "Creator A",
    "optionType": "Image",
    "votes": 20,
    "turnaround": "4m 12s",
    "ctrBefore": 2.1,
    "ctrAfter": 2.8,
    "summary": "Winner was the closer crop. CTR is the creator’s own number."
  }
]
```

Leave fields null/omit CTR if they did not measure it. Do not invent percentages. The public page is `/case-studies`.

## Mainnet gates (do not do this in Phase 11)

Only consider mainnet after:

- Real (non-demo) creators have run batches and you have a snapshot + at least one honest case study
- Treasury key handling and payout process are documented for real SOL
- Anchor program has a review/audit pass if `SETTLEMENT_MODE=onchain`

Until then: **devnet only**, $1/vote from creators and $0.50/vote to voters (paid in SOL), custodial or flagged on-chain escrow.
