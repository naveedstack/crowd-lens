# CrowdLens program — light review checklist

Not an audit. Do this before any mainnet discussion.

## Authority

- [ ] `initialize` payer is the intended oracle authority (API `TREASURY_SECRET_KEY`). Rotate that keypair before mainnet; the committed `keys/crowdlens-keypair.json` is the **program upgrade** key, not user funds.
- [ ] `commit_votes`, `settle_chunk`, and `close_task` all require `config.authority`.
- [ ] Workers never sign settle. The API is trusted to pass the Phase 7 payout list. A compromised authority can drain every open task PDA.

## PDAs

- [ ] Config seeds: `["config"]`.
- [ ] Creator stats: `["creator", creator]`.
- [ ] Task: `["task", creator, nonce_le_bytes]`. Nonce must equal `creator_stats.task_count`.
- [ ] `create_task` rejects `amount != required * 1_000_000`.

## Settlement

- [ ] `commit_votes` is one-shot and rejects the zero hash.
- [ ] `settle_chunk` caps at 4 workers, rejects overpay, zero amounts, duplicate workers, and paying the task/authority account.
- [ ] Idempotency for a worker is **Postgres** (`Submission.payout_signature`). Re-sending the same worker after a successful chunk would pay twice on-chain.
- [ ] `close_task` requires `remaining_lamports == 0` and returns rent to the creator.

## Leftover lamports

- [ ] After the last chunk, `remaining_lamports` must be 0 or close fails. The API must pay the full escrowed amount (Phase 7 totals equal `priceFor(N)`).

## Clients

- [ ] `SETTLEMENT_MODE=custodial` is the production default until this program is deployed and initialized on **devnet**.
- [ ] Do not point `RPC_URL` at mainnet.
