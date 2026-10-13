# Product Requirements Document  
## CrowdLens — Community-Powered Content Oracle (MVP)

| | |
| --- | --- |
| **Product** | CrowdLens |
| **Stage** | MVP (grant / Devnet) |
| **Version** | 1.3 |
| **Date** | 12 October 2026 |
| **Network** | Solana Devnet only |
| **Program ID** | `4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4` |
| **App** | https://crowdlens-bay.vercel.app |
| **API** | https://crowdlens-api.vercel.app |
| **Health** | https://crowdlens-bay.vercel.app/health (proxies the API) |
| **Source idea** | [Superteam: CrowdLens — A Community-Powered Content Oracle for Creators and AI teams](https://superteam.fun/build/ideas/crowdlens---a-community-powered-content-oracle-for-creators-and-ai-teams) |
| **Repo** | https://github.com/naveedstack/crowd-lens |

---

## 1. Purpose

This PRD describes **what CrowdLens ships today** and what is **deferred**. Section 14 is the gap list against the original Superteam idea: every feature named there that this MVP does **not** implement.

Do not treat Next Phase items as live product.

---

## 2. Problem

Creators need a cheap, fast way to pick a thumbnail or poster before they publish. Classic A/B tests are slow or closed. There is no simple, incentivized loop where **real humans vote**, **SOL settles**, and the **winner is public**.

This MVP does **not** claim AI suggestions, caption labeling for model teams, or a DePIN node network.

---

## 3. Product vision (MVP)

A **decentralized image-comparison oracle** on Solana Devnet:

1. Creator uploads **2–5 images**, chooses how many votes (1–100), and **escrows SOL** in a task PDA.
2. Validators with wallets pick an option (optional comment).
3. When the batch fills, the API **commits a vote-set hash + winner** on-chain and **pays aligned voters from escrow**.
4. Creator sees counts, winner (or tie), turnaround, and can **export** votes.

**One-line:** Humans pick the thumbnail; SOL pays them; the winner is on Explorer.

---

## 4. Goals and non-goals

### Goals (this release)

- End-to-end creator → escrow → vote → on-chain settle on **Devnet**.
- Listed economics: **$1 / vote** creator, **$0.80 / vote** (80%) validator, paid in SOL.
- Trust basics: no self-vote, dwell/gap, reputation, majority/minority split.
- Public demo a Phantom-on-Devnet user can try.

### Non-goals (this release)

See **§14 Next Phase** for the full Superteam gap list.

---

## 5. Users

| Persona | Job | Primary surfaces |
| --- | --- | --- |
| **Creator** | Pay for human picks on image variants | `/creator`, `/creator/new`, `/creator/task/[id]` |
| **Validator** | Vote and earn Devnet SOL | `/validators`, `/validators/votes`, task, history, earnings |
| **Reviewer / grant** | Verify the loop and KPIs | `/`, `/stats`, `/case-studies`, Explorer, `/health` |

Phantom must be on **Devnet**. Empty wallets use https://faucet.solana.com. A creator **cannot** vote on their own task; they need a second wallet.

---

## 6. Information architecture

| Route | Role |
| --- | --- |
| `/` | Marketing landing (theme, motion) |
| `/creator` | Creator task list |
| `/creator/new` | Create + pay |
| `/creator/task/[id]` | Results, analytics, export |
| `/validators` | Validator guide + earnings model |
| `/validators/votes` | Open ballots |
| `/validators/task/[id]` | Cast vote |
| `/validators/history` | Past votes |
| `/validators/earnings` | Payout history / stats |
| `/stats` | Pilot KPIs vs targets |
| `/case-studies` | Optional published results |
| `/voter*` | Redirects to `/validators*` |

---

## 7. Functional requirements — shipped

### 7.1 Access and auth

| ID | Requirement |
| --- | --- |
| AUTH-1 | Connect Phantom (wallet adapter) on Devnet. |
| AUTH-2 | Sign a one-time nonce; issue JWT. |
| AUTH-3 | Separate creator and worker sessions; **one signature** can mint both (`from-session`). |
| AUTH-4 | Faucet hint in chrome when testers need Devnet SOL. |
| AUTH-5 | Light/dark theme, persisted (`crowdlens.theme`), no FOUC. |

### 7.2 Creator

| ID | Requirement |
| --- | --- |
| CR-1 | Create a task: title, **2–5 images**, vote count **1–100**. |
| CR-2 | Images via presigned S3 upload (≤ 5 MB, images only). |
| CR-3 | Quote in USD and SOL at live rate (Jupiter, CoinGecko fallback); pay **$1 × votes** in SOL. |
| CR-4 | Pay-in funds the **task PDA** (`create_task`) in on-chain mode. |
| CR-5 | Task list: open/done, progress, winner or tie. |
| CR-6 | Task detail: per-option counts, winner, commitment, escrow, comments, turnaround. |
| CR-7 | Export votes as **CSV or JSON** (anonymized worker hash; no raw wallet in file). |
| CR-8 | Caption/text option create is **rejected** (image-only MVP). |

### 7.3 Validator

| ID | Requirement |
| --- | --- |
| VAL-1 | Guide at `/validators`: 80% share, steps, estimator, ballot preview, FAQ. |
| VAL-2 | Open-task queue with payout shown per task. |
| VAL-3 | Vote: pick one option, optional comment, signed session. |
| VAL-4 | Cannot vote on own task; one submission per worker per task. |
| VAL-5 | History of submissions; earnings / last Devnet payout + Explorer link. |
| VAL-6 | On-chain mode: SOL lands in the **voter wallet** via `settle_chunk` when the batch fills. |
| VAL-7 | **Withdraw** only for leftover **custodial** pending from older tasks. |

### 7.4 Oracle lifecycle

| ID | Requirement |
| --- | --- |
| ORC-1 | Votes stored in Postgres until `required_submissions` is reached. |
| ORC-2 | Majority option wins; ties marked done with no single winner (`winner_option_id` 0). |
| ORC-3 | `commit_votes`: 32-byte vote-set hash + winner id (votes are **not** each an on-chain tx). |
| ORC-4 | `settle_chunk`: pay validators from remaining escrow. |
| ORC-5 | `close_task`: leftover **~20%** to treasury authority; rent to creator. |

### 7.5 Economics and quality

| ID | Requirement |
| --- | --- |
| ECO-1 | Creator **$1.00** / vote; validator base **$0.80** / vote (`floor(lamports × 4/5)`). |
| ECO-2 | Aligned (majority) voters share extra taken from **outlier haircut**. |
| ECO-3 | Reputation 0–100: aligned **+2**, outlier **−5** (off-chain Postgres). |
| ECO-4 | Min dwell **3s** after a task is served; min **3s** between votes. |
| ECO-5 | Rate limits on auth, submit, presign, export, payout. |

### 7.6 Public / ops

| ID | Requirement |
| --- | --- |
| PUB-1 | Landing + validator landing: semantic theme tokens, backdrop, scroll reveal. |
| PUB-2 | `/stats`: votes, unique validators/creators, under-5-min rate; demo seed excluded from **pilot** KPIs. |
| PUB-3 | `/case-studies` from JSON; CTR only if the creator provided it (never invented). |
| PUB-4 | `GET /health` → `{ "ok": true }`. |
| PUB-5 | Demo seed so a visitor can vote without waiting for a new creator task. |

---

## 8. Economics (normative)

| Rule | Value |
| --- | --- |
| Network | Solana **Devnet** |
| Creator list price | **USD 1.00** per requested vote, converted to SOL |
| Validator share | **80%** of creator escrow (**USD 0.80** list) |
| Protocol share | Remaining **~20%** on `close_task` |
| Batch size | 1–100 votes |
| Images per task | 2–5 |
| Example | 1-vote task ≈ **$1 in SOL** in; ≈ **$0.80 in SOL** to the voter |

USD is the **list price**. Wallet transfers are always **SOL**.

---

## 9. User flows (happy path)

**Creator**  
Connect → sign in → `/creator/new` → title + 2–5 images + vote count → pay quoted SOL (`create_task`) → share `/validators/votes` → open task page when done → export.

**Validator**  
Different wallet on Devnet → `/validators/votes` → connect / sign in → open task → pick option → when batch fills, SOL in wallet (`SettleChunk`) → History / Earnings.

---

## 10. System design (constraints)

```text
Creator / Validator wallets
        │
   Next.js (Vercel)
        │
   Express API  ── Postgres (Prisma)
        │       ── S3 (images)
        │
   Solana Devnet
   PDA escrow + treasury authority
   (commit_votes, settle_chunk, close_task)
```

| Piece | Responsibility |
| --- | --- |
| Next.js | UI, wallet, theme |
| Express | Auth, tasks, votes, quotes, settlement |
| Postgres | Users, workers, tasks, options, submissions, payouts, reputation |
| S3 | Image blobs |
| Anchor program | Escrow, commitment, payouts, close |
| API treasury key | Oracle authority — **not** the voter’s signer for settle |

**Settlement modes:** `SETTLEMENT_MODE=onchain` is the live path. Custodial treasury send remains for migration leftovers.

---

## 11. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Security | Nonce sign-in; no secrets in the client; export without raw voter addresses |
| Integrity | Unique `(worker, task)` submission; server-side self-vote block |
| Observability | API request logs; `/health`; Explorer links for pay-in and payout |
| UX | Light/dark; `prefers-reduced-motion` on landing animations |
| Cluster | Devnet RPC only; UI copy must not say Mainnet |

---

## 12. Success metrics (pilot)

Tracked on `/stats` (excluding demo seed):

| KPI | Target |
| --- | --- |
| Votes | 10,000+ |
| Unique validators | 500+ |
| Unique non-demo creators | 3–5 |
| Average batch turnaround | under 5 minutes |

---

## 13. Acceptance (MVP done)

A stranger with Phantom on Devnet can:

1. Create an image task and see the pay-in on Explorer.
2. Vote from a **second** wallet.
3. See ~80% of that vote’s escrow in the voter wallet after the batch fills (`SettleChunk`).
4. See winner (or tie) on the creator task page.
5. Hit `GET https://crowdlens-bay.vercel.app/health` (or `https://crowdlens-api.vercel.app/health`) → `{ "ok": true }`.

---

## 14. Next Phase — original idea, not implemented

Source: [Superteam CrowdLens idea](https://superteam.fun/build/ideas/crowdlens---a-community-powered-content-oracle-for-creators-and-ai-teams).

Every row below is **named in that idea** (problem, solution, resources, or “already building”) and is **not shipped** in this MVP. Do not demo or market these as live.

### 14.1 Gap list (idea → MVP)

| ID | In the original idea | MVP status | What exists instead |
| --- | --- | --- | --- |
| NP-1 | **Lens AI** — AI layer that learns from vote data and gives **generative suggestions** to improve content | Not built | No model, no suggestion UI, no vote-trained ranking |
| NP-2 | **Feedback flywheel**: human votes train AI → AI helps creators → better content → more voting | Not built | Loop stops at human vote + SOL payout |
| NP-3 | **AI teams / data curation** — scalable, quality-controlled human judgments for models; product for AI teams | Not built | Creator-only CSV/JSON export; no buyer portal or labeled dataset marketplace |
| NP-4 | **Caption** (and other text) variants — problem statement includes thumbnails, **captions**, and poster designs | Not live | Image comparison only (2–5 stills). Caption/text create is rejected |
| NP-5 | **Votes recorded on-chain** (each vote as oracle evidence) | Partial / not as specified | Votes live in **Postgres**. Chain stores one `commit_votes` hash + `winner_option_id`, then payouts |
| NP-6 | **Slashing** to discourage spam | Not built | No stake. Outliers get a **smaller SOL share** and lose **off-chain reputation** points |
| NP-7 | **Compressed NFTs (cNFTs)** — listed under Dev Tools / resources (vote receipts or badges) | Not built | No NFT mint, no badge, no compressed Merkle tree |
| NP-8 | **DePIN-powered** network of independent workers | Not built | One Express API + one Anchor program. Validators are **wallets**, not DePIN nodes |
| NP-10 | Open protocol for **subjective content** in general (not only stills) | Narrowed | Stills only (thumbnails/posters). No video, audio, or live caption A/B |
| NP-11 | On-chain **reputation** as part of a quality-controlled system | Off-chain only | Score 0–100 in Postgres; not in the program accounts |
| NP-12 | **Mainnet** / production Solana cluster (implied by a real oracle and DePIN) | Not built | **Devnet only** |
| NP-13 | Crowd validation that is not **noisy or gamed** — identity so one human ≠ many votes | Not built | Self-vote block, 3s dwell/gap, rate limits. `WALLET_MIN_SIGNATURES` exists but **defaults to 0**. Each wallet is one vote; Devnet faucet wallets are free. Reputation does **not** weight ballots. Slashing (NP-6) does not solve this |
| NP-14 | **Open, incentivized protocol** other apps can use | Not built | Private JWT app API + creator CSV/JSON export. No public task/read API, no SDK, no third-party integration |
| NP-15 | **Diverse human input** vs closed A/B tests — creators choose *who* votes | Not built | Open queue; no region, niche, or demographic filters on tasks or validators |
| NP-16 | **Mobile** (idea tag) | Not as specified | Responsive Next.js in a browser. No native iOS/Android app, no store listing |

### 14.2 Idea items that *are* in the MVP (not Next Phase)

These Superteam bullets **are** implemented and belong in §7, not here:

- Creators upload multiple image variations (idea example **4–5** thumbnails; MVP allows **2–5**. Former NP-9 mixed this up with vote count 1–100, which is an MVP product choice, not an idea miss)
- Validators (real humans with wallets) vote
- Rewards for consensus-aligned votes (80% escrow + majority/minority split)
- Reputation as a quality signal (off-chain)
- Wallet login, vote submission, reward logic, validator dashboard
- Solana (Anchor), Phantom, monorepo, Next.js

### 14.3 Delivery order (next phase)

| Order | Phase | Idea IDs | Notes |
| --- | --- | --- | --- |
| 1 | Text / caption tasks | NP-4, NP-10 | Closest to the written problem statement |
| 2 | Stronger oracle | NP-5, NP-6, NP-11, NP-13 | On-chain votes, slashing, portable reputation, **sybil / proof of personhood** (wallet-history gating or reputation-weighted votes). NP-6 does not replace NP-13 |
| 3 | Audience targeting | NP-15 | Region / niche filters so “diverse human input” is choosable |
| 4 | Open protocol | NP-14 | Public API + SDK so other apps can post tasks and read results |
| 5 | AI and data | NP-1, NP-2, NP-3 | Dataset for AI teams first, then Lens AI + flywheel |
| 6 | Identity / network | NP-7, NP-8 | cNFTs, then DePIN only if still a goal |
| 7 | Mobile | NP-16 | Native app only if the Mobile tag still matters; web stays the MVP |
| 8 | Production cluster | NP-12 | Mainnet after audit + Devnet pilot evidence |

**Prerequisite:** anonymized dataset export for AI teams before Lens AI.

---

## 15. Document history

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-10-12 | MVP as built (chat draft). |
| 1.1 | 2026-10-12 | Saved to repo. §14 lists every Superteam idea feature not implemented. |
| 1.2 | 2026-10-12 | Header lists API and `/health` URLs. |
| 1.3 | 2026-10-12 | NP-9 moved to §14.2 (4–5 thumbnails is an example). Added NP-13 sybil/identity, NP-14 open protocol, NP-15 audience targeting, NP-16 mobile. |
