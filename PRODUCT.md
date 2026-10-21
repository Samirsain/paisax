# Product

<!-- impeccable:product-schema 1 -->

> Written from the brief without an interview: the user asked to skip questions. Every fact marked *(inferred)* is Claude's call and should be confirmed.

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui: the user's choice. Persistence, auth and payments: delegated. For v1, Claude chose a single demo user whose state lives in browser storage, plus a demo checkout. Real auth, a database and Razorpay come later.

## Users

People in India building a small daily wellness habit, mostly on their phones, in short moments: before work, at lunch, before bed *(inferred)*. Their job is to open the app once a day, collect today's credits, and spend them on one session that fits the moment.

## Product Purpose

Steady *(name inferred)* is a wellness subscription. A plan costs a fixed price in ₹ and runs for a fixed number of days. Each day the subscriber claims that plan's daily credit allowance and spends credits to unlock sessions: workouts, guided meditations, meal plans and coach check-ins. Success means subscribers claim daily and actually use what they unlock.

## Positioning

Credits are an allowance for using the service. They are not money. They have no cash value, cannot be withdrawn or transferred, and are never presented as earnings, returns or ROI. The daily claim exists to build the habit of showing up. It does not exist to pay anything out.

## Operating Context

- Claim: once per active plan per 24 hours, measured from that plan's last claim.
- A plan completes when its days are used up. Claimed credits stay in the balance until spent *(inferred)*.
- Sessions are unlocked with credits and stay unlocked.
- Bottom navigation on mobile. Profile is reached from the header.

## Capabilities and Constraints

- Plans (placeholder prices, not confirmed): Starter ₹199 for 30 days at 20 credits/day; Plus ₹399 for 30 days at 45 credits/day; Pro ₹799 for 30 days at 100 credits/day.
- Never show a ₹ value next to credits, a credits-to-₹ rate, a withdraw action or an "earn" framing.
- Checkout is a demo until Razorpay is wired up.

## Evidence on Hand

None. There's no real session content, coach, testimonial, user count or rating. All library content is synthetic demo material and must be labelled as such. Never invent social proof.

## Product Principles

1. The allowance serves the habit: every screen points toward using a session, not toward accumulating a balance.
2. Plain numbers: price, days, credits per day and sessions are stated outright, with no hidden terms.
3. One tap a day: claiming must be the fastest action in the app.
4. Calm over urgency: no streak-loss threats, countdown pressure or casino mechanics.

## Accessibility & Inclusion

Large touch targets, a readable base size and WCAG AA contrast. Status is never conveyed by colour alone *(inferred baseline)*.
