---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# DailyEarn app (Home, Plans, My Plans, Wallet, Refer, Profile)

Mode: Operate. A player claims today's coins in one tap, then spends coins on plans that pay coins daily. Audience: portfolio reviewers, mostly on a phone. It ships as an installable PWA with one phone-width column on every screen. Build path: code-led (no image generation).

Pinned by the user (2026-10-22): match the Stitch reference screens in `../stitch-daily-earn/`, as an app. This replaced the earlier truck-art stripe direction (seed be6c0772), which is retired. Coins only: no ₹, ROI, capacity bars, deposits, withdrawals or real-company branding.

Unresolved: none blocking.

## Direction contract

THESIS: A calm daily-reward app in the Stitch system, where the claim card is the hero and every number is a plain coin count. It refuses the investment-dashboard reading the Stitch originals had (₹, ROI chips, scarcity bars) while keeping their layout.

OWN-WORLD: The Stitch Material 3 roles. Lavender-white ground #faf8ff, white 12px cards with soft shadows and no borders, Inter. Indigo #4648d4 is for primary actions and buying, emerald #006c49 only for claiming, mint #6cf8bb chips for good states, amber #825100 for ready and streak. Indigo-gradient summary cards, round icon tiles, pill chips, and a 4-tab bar whose active icon sits in an indigo-tint pill.

STORY: See today's coins and where they come from, claim in one tap while the count eases to 0, watch the check-in week fill in, then buy another plan through a bottom sheet and track it in My Plans.

FIRST VIEWPORT: At 390px: a sticky white bar with the logo and DailyEarn in indigo on the left, and the Demo chip and avatar on the right. Below it the greeting with a streak pill, then the claim card: a DAILY CLAIM READY chip, the coin count at 40px, a "From …" breakdown, and a full-width emerald Claim button. The two stat cards sit at the fold, with the bottom tab bar fixed below.

FORM: user-pinned, the Stitch reference system (not from the roll). Signature interaction: claiming eases the ready count to 0 while the balance and check-in tile update. Buying uses a bottom sheet that goes from order summary to "Plan activated".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
