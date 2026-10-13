# CrowdLens

Started from Pratik Kale’s open-source CrowdLens MVP (https://github.com/Pratikkale26/CrowdLens); during this build we added the Anchor escrow program, on-chain commit and settlement, live USD-to-SOL pricing, and a single creator/validator app.

This demo is **https://crowdlens-bay.vercel.app**. Pratik’s public site is **https://crowdlens.kalehub.com** — they are not the same deployment. His repo has no license file; this sentence is the disclosure, not a new license.

Creators escrow SOL on **Solana Devnet**, humans vote on 2–5 images, and when the batch fills the winner is committed on-chain and aligned voters are paid from escrow.

| Surface | URL |
| --- | --- |
| App | https://crowdlens-bay.vercel.app |
| Creator | https://crowdlens-bay.vercel.app/creator |
| Validator votes | https://crowdlens-bay.vercel.app/validators/votes |
| Stats | https://crowdlens-bay.vercel.app/stats |
| API health | https://crowdlens-api.vercel.app/health |
| App health (proxies the API) | https://crowdlens-bay.vercel.app/health |

Use **Phantom on Devnet**. Faucet: https://faucet.solana.com

Source lives in [`CrowdLens/`](CrowdLens/). Local setup, economics, and the PRD are in [`CrowdLens/README.md`](CrowdLens/README.md) and [`CrowdLens/docs/PRD.md`](CrowdLens/docs/PRD.md).
