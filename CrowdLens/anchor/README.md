# CrowdLens Anchor program

Escrows creator SOL in a per-task PDA and pays validators from that PDA. Votes stay off-chain.

Program ID (localnet + devnet): `4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4`

```bash
# from CrowdLens/anchor
cp keys/crowdlens-keypair.json target/deploy/crowdlens-keypair.json
NO_DNA=1 anchor build
NO_DNA=1 bun install
NO_DNA=1 anchor test
```

Deploy (devnet only):

```bash
NO_DNA=1 anchor deploy --provider.cluster devnet
bun run --filter=api scripts/init-crowdlens-program.ts
```

Then set `SETTLEMENT_MODE=onchain` and `CROWDLENS_PROGRAM_ID=4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4` on the API.

Review notes: [AUDIT.md](AUDIT.md).
