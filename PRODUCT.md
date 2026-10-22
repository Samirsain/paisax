# Product

<!-- impeccable:product-schema 1 -->

> Updated 2026-10-21 after a short interview. Confirmed by the user: portfolio/demo audience, coins are a game currency only (streak and levels), Next.js stack. Updated 2026-10-22: the user asked for an installable mobile app (PWA) that looks like their Stitch screens. Facts marked *(inferred)* are Claude's call.

## Platform

web: an installable PWA (manifest, icons, offline service worker) laid out as a phone app on every screen size. Desktop shows the same app column centred.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui (Base UI): the user's choice. One demo player whose state lives in browser storage. No backend, auth or payments.

## Users

People reviewing a portfolio piece: recruiters, clients and other designers or developers, on a phone or a laptop. They should understand the daily loop within seconds and judge the craft *(inferred)*. Inside the demo, the persona is a player who opens the app once a day to collect coins and keep a streak going.

## Product Purpose

DailyEarn is a daily coin-collecting game. Each day the player checks in, claims coins from the plans they own, and keeps their streak alive. Coins buy more plans, and each plan drips coins back daily for 30 days. Lifetime coins raise the player's level. Success means a reviewer gets the loop at a glance and finds every screen finished.

## Positioning

Coins are a game currency. They can't be bought with money, withdrawn, transferred or exchanged for cash, and they're never shown with ₹, ROI, "returns", "investment" or "income" language. Plans aren't tied to real companies, brands or logos.

## Operating Context

- Daily check-in: once per calendar day. The reward grows with the streak and caps at day 7.
- Plan claim: once per plan per 24 hours, measured from that plan's last claim. A new plan can be claimed right away.
- A plan completes when its 30 days are claimed.
- Streak: consecutive calendar days with at least one claim. Missing a day resets it to 1.
- Level: set by lifetime coins collected.
- Invite friends: a code and a share link. A simulated invite grants a coin bonus (demo only).
- Demo tools: skip 24 hours and reset all data.
- Any claim counts as the day's check-in, so the check-in bonus comes with the first claim of the day. Plans can be claimed all at once (Home) or one at a time (My Plans).
- Plans: Starter, Growth, Premium and Elite, each 30 days. One of each runs at a time.
- Screens: Home, Plans (buy), My Plans (active / completed), Wallet (coin history), Refer, Profile. Bottom tab bar: Home, Plans, My Plans, Wallet. Profile opens from the header avatar; Refer opens from Home's invite card and the Wallet.

## Capabilities and Constraints

- No deposits, withdrawals, UPI or payment methods, cash value or real-money wording anywhere.
- No fabricated social proof. That rules out a live feed of other users, fake scarcity or capacity bars, and invented counts.
- All data is local and synthetic. The app is labelled as a demo.

## Brand Commitments

Name "DailyEarn" (carried over from the user's Stitch project). The look follows the user's Stitch reference screens (pinned 2026-10-22). The logo is the Stitch mark redrawn in SVG, with a coin replacing its currency glyph (`components/marks.tsx`).

## Evidence on Hand

There are no real users, testimonials or metrics. The user's Stitch reference screens are at `../stitch-daily-earn/*.png`. Follow their layout and visual system, but leave out their ₹ amounts, ROI, capacity bars, withdrawals and payment details. Never invent social proof.

## Product Principles

1. One tap a day: claiming is the fastest action in the app.
2. Plain numbers: cost, coins per day, days and level thresholds are stated outright.
3. Calm game, not casino: no countdown pressure, streak-loss threats or slot-machine visuals.
4. Honest demo: everything is visibly a game with virtual coins.

## Accessibility & Inclusion

Large touch targets, a readable base size and WCAG AA contrast. Status is never conveyed by colour alone, and motion respects reduced-motion settings *(inferred baseline)*.
