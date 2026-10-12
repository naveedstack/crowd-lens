---
name: Decentralized Oracle Engine
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-numeric:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is engineered for a decentralized consensus and content evaluation protocol operating on Solana Devnet. The visual ethos rejects high-frequency crypto tropes, flashing neo-brutalism, and casino-like gamification. Instead, it projects the quiet precision, institutional security, and analytical calm of high-end developer instrumentation and modern creator studios.

The aesthetic fuses deep slate surfaces with controlled luminous accents:
- **Atmosphere:** Deep focus, low-glare dark surfaces (`#020617`), and subdued structural scaffolding.
- **Personality:** Analytical, objective, transparent, and frictionless.
- **Accents:** Restrained chromatic energy via calibrated violet primaries and precise cyan highlights that signify verifiability and active consensus states without visual noise.

## Colors

The palette establishes an ergonomic hierarchy across complex consensus trees, dual-currency readouts, and multi-stakeholder decisions.

### Surface Tiers
- **Canvas Base:** `#020617` (Slate 950) — High-immersion, zero-fatigue backdrop.
- **Card/Layer 1:** `#0f172a` (Slate 900) — Primary surface for oracle jobs, evaluation grids, and account panels.
- **Layer 2 / Interactive Surface:** `#1e293b` (Slate 800) — Hover elevations, nested asset trays, and inactive inputs.
- **Structural Outlines:** `#334155` (Slate 700) for active borders; `#1e293b` (Slate 800) for baseline structural dividers.

### Primary & Accents
- **Primary Violet:** `#8b5cf6` (Hover: `#7c3aed`, Active: `#6d28d9`) — Designated strictly for state confirmation, final voting submissions, and primary transaction paths.
- **Secondary Cyan:** `#06b6d4` (Bright: `#22d3ee`) — Used for telemetry, cryptographic hash markers, active Devnet indicators, and selected state chips.
- **Headline Gradient:** Linear transition from `#a78bfa` (Violet 400) through `#22d3ee` (Cyan 400) at 135°, applied strictly to top-level section hero headlines.

### Functional States
- **Settlement & Yield (Emerald):** `#10b981` — Reward distributions, quorum consensus met, and accrued creator/voter yields.
- **Pending & In-Flight (Amber):** `#f59e0b` — Devnet block confirmations, voting windows closing, and stake-locking stages.
- **Disputed & Failure (Rose):** `#f43f5e` — Consensus slashed, signature rejections, and transaction rollbacks.

## Typography

The type system blends the structural character of Plus Jakarta Sans for headers with the micro-legibility of Inter for telemetry and dense operational listings.

- **Headline Hierarchy:** Plus Jakarta Sans delivers geometric precision with tight, purposeful tracking (`-0.01em` to `-0.03em`). Headline text pairs with clean slate tones or the signature cyan-violet gradient mask.
- **Body & Data:** Inter provides optimal optical clarity in data-dense interfaces. Tabular lining numbers (`font-variant-numeric: tabular-nums`) must be enforced for all currency calculations, epoch countdowns, and validator balances.
- **Dual Currency Standard:** Standardize financial values into split tokens: the fiat value renders in neutral-200 weight (`$1.00`), followed by a low-contrast spacer (`·` in `#64748b`), terminating with the native network representation (`0.0083 SOL` in `#94a3b8` or cyan accent when active).

## Layout & Spacing

The layout is built on a responsive 12-column grid anchored inside a maximum container width of `1280px` to retain optical density and prevent overextended line lengths on ultra-wide developer displays.

- **Desktop (1024px+):** 12-column grid with `1.5rem` (24px) gutters and `2rem` (32px) screen margins. Image comparison tables use symmetrical 6/6 column splits or 8/4 splits when a telemetry panel is pinned.
- **Tablet (768px – 1023px):** 8-column grid with `1rem` (16px) gutters. Comparison sets fold into tabbed toggle layouts or vertical cascades.
- **Mobile (< 768px):** 4-column fluid layout with `1rem` (16px) outer margins. Wallet controls condense into fixed top-bar triggers and bottom sheet confirmation flows.

## Elevation & Depth

Visual order relies on chromatic surface stepping, low-contrast outline boundaries, and selective edge lighting rather than dropped drop shadows.

- **Baseline Level (Canvas):** Flat `#020617` base.
- **Tier 1 (Surface Cards):** `#0f172a` filled panels with a uniform, hairline border: `1px solid #1e293b`.
- **Tier 2 (Elevated Panels & Flyouts):** `#1e293b` container backed with an ultra-subtle ambient glow: `0 10px 30px -10px rgba(2, 6, 23, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)`.
- **Active Focus & Staking States:** 1px stroke shift to `#8b5cf6` or `#06b6d4`, accompanied by a minimal violet/cyan tinted back-glow: `0 0 20px -5px rgba(139, 92, 246, 0.15)`.
- **Translucent Overlays:** Modal and bottom-sheet backdrops utilize `#020617` at 80% opacity with `backdrop-filter: blur(12px)`.

## Shapes

The geometric architecture uses balanced medium corner radiuses (`0.5rem` / 8px baseline) to balance technical precision with approachable ergonomics.

- **Cards and Containers:** `rounded-lg` (`1rem` / 16px) to frame multi-metric data groups and media panels.
- **Inputs, Buttons, and Controls:** `rounded` (`0.5rem` / 8px) for strict geometric balance.
- **Tags, Badges, and Wallet Badges:** Full-pill radiuses (`9999px`) to immediately distinguish contextual micro-indicators and address anchors from structural content frames.

## Components

### Buttons
- **Primary:** Background `#8b5cf6`, text `#ffffff`, font weight `500`. Hover state transitions to `#7c3aed`. Active state shifts to `#6d28d9`. Padding: `0.625rem 1.25rem`.
- **Secondary/Outlined:** Background transparent, border `1px solid #334155`, text `#f8fafc`. Hover state transitions to background `#1e293b` and border `#475569`.
- **Destructive:** Background `#f43f5e` with hover `#e11d48`, text `#ffffff`.

### Wallet Controls (Phantom Style)
- Compact pill-shaped modules situated in top-level utility navigation.
- Inactive state: Border `1px solid #334155`, background `#0f172a`, displaying truncated Devnet public key (`7xK...9zQ`), an indicator dot for Devnet cluster state (`#06b6d4`), and small dual-balance pill.
- Dropdown Menu: Elevated `#0f172a` container, containing one-click RPC endpoint switching, Devnet air-drop faucet trigger, disconnect button, and copy-key micro-interactions.

### Content Oracle Image Comparison Cards
- Side-by-side or stacked split frames wrapped in `1px solid #1e293b`.
- Header houses canonical token IDs, dual-currency reward sizes (`$4.50 · 0.037 SOL`), and voting time limits.
- Asset rendering: Enclosed in rounded `#020617` viewing bays with integrated zoom, hash verification chips (`SHA-256`), and binary vote buttons (`Option A` / `Option B`) pinned to card bases.

### Form Inputs & Stake Sliders
- Background: `#020617`, border: `1px solid #1e293b`, typography: `Inter` 14px text `#f8fafc`.
- Focus state: Border shifts to `#8b5cf6` with zero default outline.
- Currency Fields: Dual inline feedback displaying realtime conversions as users input either USD or SOL values.

### Chips & Status Indicators
- **Devnet Status:** Full pill, `#0f172a` background, border `1px solid #06b6d4`, text `#22d3ee`, paired with an animated pulse dot.
- **Rewards Accrued:** Text `#10b981`, background `rgba(16, 185, 129, 0.1)`, border `1px solid rgba(16, 185, 129, 0.2)`.
- **Pending Quorum:** Text `#f59e0b`, background `rgba(245, 158, 11, 0.1)`, border `1px solid rgba(245, 158, 11, 0.2)`.