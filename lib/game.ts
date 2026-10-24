// Pure game rules for PaisaX. Daily earnings and streak logic.

export type PlanId =
  | "solar_300"
  | "solar_1000"
  | "solar_2000"
  | "solar_10000"
  | "solar_50000"
  | "free"

export interface Plan {
  id: PlanId
  name: string
  tag: string
  blurb: string
  cost: number
  perDay: number
  days: number
  category?: "normal" | "vip"
  limit?: string
  image?: string
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Solar Trial Plan (₹0)",
    tag: "Free Trial",
    blurb: "Bina kisi payment ke turant shuru kare! Har din ₹10 free direct reward paye.",
    cost: 0,
    perDay: 10,
    days: 30,
    category: "normal",
    limit: "Limit 1/1",
    image: "/dairymilk/solar_panel.jpg",
  },
  {
    id: "solar_300",
    name: "Solar Starter 300 – Daily Income",
    tag: "Sabse Popular",
    blurb: "Har din ₹40 direct wallet me paye! Bas ₹300 lagao aur pure 60 din tak ₹2,400 kamao.",
    cost: 300,
    perDay: 40,
    days: 60,
    category: "normal",
    limit: "Limit 0/10",
    image: "/dairymilk/product.png",
  },
  {
    id: "solar_1000",
    name: "Solar Pro Grid 1000 – Daily Income",
    tag: "High Demand",
    blurb: "Har din ₹150 ki pakki daily income. 75 din me pure ₹11,250 ka guaranteed munafa.",
    cost: 1000,
    perDay: 150,
    days: 75,
    category: "normal",
    limit: "Limit 0/10",
    image: "/dairymilk/solar_panel.jpg",
  },
  {
    id: "solar_2000",
    name: "Solar Mega Station 2000 – Daily Income",
    tag: "Bumper Kamaai",
    blurb: "Har subah ₹330 automatic payout! 75 din me ₹24,750 ka solid return.",
    cost: 2000,
    perDay: 330,
    days: 75,
    category: "normal",
    limit: "Limit 0/10",
    image: "/dairymilk/product.png",
  },
  {
    id: "solar_10000",
    name: "Solar Industrial Plant – Super VIP",
    tag: "Super VIP",
    blurb: "Bade investors ki pehli pasand! Har din ₹1,900 income, 90 din me pure ₹1,71,000.",
    cost: 10000,
    perDay: 1900,
    days: 90,
    category: "vip",
    limit: "Limit 0/10",
    image: "/dairymilk/solar_panel.jpg",
  },
  {
    id: "solar_50000",
    name: "Solar Megawatt Farm – Royal VIP",
    tag: "Royal King",
    blurb: "Industrial Solar Farm ownership! Har din ₹6,000 direct bank withdrawal. 120 din me ₹7.2 Lakh ka bumper return.",
    cost: 50000,
    perDay: 6000,
    days: 120,
    category: "vip",
    limit: "Limit 0/10",
    image: "/dairymilk/bannerr.png",
  },
]

/** Withdrawal rules */
export const WITHDRAW_MIN = 200        // minimum ₹200
export const WITHDRAW_FEE_PCT = 3      // 3% processing fee
export const WITHDRAW_OFF_DAYS = [0, 6] // 0=Sunday, 6=Saturday — no withdrawals

export function canWithdrawToday(): boolean {
  const day = new Date().getDay()
  return !WITHDRAW_OFF_DAYS.includes(day)
}

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id) || PLANS[0]
const isPlanId = (id: unknown): id is PlanId => PLANS.some((p) => p.id === id)

export const WELCOME_GIFT = 0
export const INVITE_BONUS = 100
/** Extra bonus to referrer when referred user buys their first plan. */
export const REFER_PLAN_BONUS = 50
export const STREAK_CAP = 7
/** Check-in reward for a given streak day: 5, 10 … 35, then flat. */
export const checkinCoins = (streakDay: number) => 5 * Math.min(streakDay, STREAK_CAP)

/** Lifetime coins needed to reach each level; index 0 is level 1. */
export const LEVELS = [0, 400, 800, 1200, 1800, 2600, 3600, 5000, 7000, 10000]

export const DAY_MS = 24 * 60 * 60 * 1000

export interface Owned {
  id: string
  planId: PlanId
  claimed: number
  boughtAt: number
  lastClaimAt: number | null
}

export type Entry = { id: string; at: number; coins: number } & (
  | { kind: "welcome" }
  | { kind: "checkin"; streakDay: number }
  | { kind: "claim"; planId: PlanId; day: number }
  | { kind: "buy"; planId: PlanId }
  | { kind: "invite" }
  | { kind: "withdraw"; amount: number; method: string }
)

export interface State {
  name: string
  coins: number
  lifetime: number
  owned: Owned[]
  history: Entry[]
  streak: number
  bestStreak: number
  lastClaimDay: number | null
  inviteCode: string
  invites: number
  /** The code from the ?invite= link this player arrived with, if any. */
  invitedBy?: string
  /** Milliseconds added to the real clock by "skip 24 hours" in dev tools. */
  skew: number
}

/**
 * Whether a saved game (untrusted, from browser storage) fits today's rules. Saves from older
 * builds, such as ones with plans that no longer exist, fail this and are replaced.
 */
export function isState(x: unknown): x is State {
  const s = x as State
  return (
    typeof s === "object" &&
    s !== null &&
    typeof s.name === "string" &&
    [s.coins, s.lifetime, s.streak, s.bestStreak, s.invites, s.skew].every(Number.isFinite) &&
    typeof s.inviteCode === "string" &&
    Array.isArray(s.owned) &&
    s.owned.every((o) => isPlanId(o?.planId) && Number.isFinite(o.claimed) && Number.isFinite(o.boughtAt)) &&
    Array.isArray(s.history) &&
    s.history.every((e) => Number.isFinite(e?.at) && Number.isFinite(e.coins) && (!("planId" in e) || isPlanId(e.planId)))
  )
}

let seq = 0
const uid = (now: number) => `${now.toString(36)}-${(seq++).toString(36)}`

/** Local calendar day as a whole number, safe across DST changes. */
export function dayOf(t: number) {
  const d = new Date(t)
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS)
}

export const isDone = (o: Owned) => o.claimed >= getPlan(o.planId).days
const tier = (o: Owned) => PLANS.findIndex((p) => p.id === o.planId)
/** Running plans in tier order, the same order the Plans screen lists them. */
export const active = (s: State) => s.owned.filter((o) => !isDone(o)).sort((a, b) => tier(a) - tier(b))
export const completed = (s: State) => s.owned.filter(isDone)

/** Whether user has at least one active or purchased paid plan (required for withdrawal) */
export function hasBoughtPaidPlan(s: State): boolean {
  return s.owned.some((o) => o.planId !== "free")
}

/** When this plan pays next, or null once all its days are claimed.
 * Day 1: Ready immediately upon activation.
 * Subsequent days: Ready at start of the next calendar day (midnight 00:00:00).
 */
export function nextClaimAt(o: Owned): number | null {
  if (isDone(o)) return null
  if (o.lastClaimAt === null) return o.boughtAt
  const d = new Date(o.lastClaimAt)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

export const ready = (s: State, now: number) =>
  s.owned.filter((o) => {
    const at = nextClaimAt(o)
    return at !== null && now >= at
  })

export const checkedInToday = (s: State, now: number) => s.lastClaimDay === dayOf(now)

/** The streak as it stands right now: it lapses once a whole calendar day passes without a claim. */
export function liveStreak(s: State, now: number) {
  if (s.lastClaimDay === null) return 0
  return dayOf(now) - s.lastClaimDay <= 1 ? s.streak : 0
}

/** The streak day today's check-in counts as, or null when it is already done. */
export function checkinDay(s: State, now: number) {
  return checkedInToday(s, now) ? null : liveStreak(s, now) + 1
}

export function readyCoins(s: State, now: number) {
  const day = checkinDay(s, now)
  return (day ? checkinCoins(day) : 0) + ready(s, now).reduce((n, o) => n + getPlan(o.planId).perDay, 0)
}

/** The earliest moment an active plan pays again. */
export function nextReadyAt(s: State) {
  const times = s.owned.map(nextClaimAt).filter((t): t is number => t !== null)
  return times.length ? Math.min(...times) : null
}

export function levelOf(lifetime: number) {
  const i = LEVELS.findLastIndex((min) => lifetime >= min)
  return { level: i + 1, floor: LEVELS[i], next: LEVELS[i + 1] ?? null }
}

const credit = (s: State, entry: Entry): State => ({
  ...s,
  coins: s.coins + entry.coins,
  lifetime: entry.coins > 0 ? s.lifetime + entry.coins : s.lifetime,
  history: [entry, ...s.history],
})

/**
 * The daily action: today's check-in plus every ready plan, or just `onlyId` when given.
 * Any claim counts as the day's check-in, so the check-in rides along with the first one.
 */
export function collect(s: State, now: number, onlyId?: string): State {
  const day = checkinDay(s, now)
  const due = ready(s, now).filter((o) => !onlyId || o.id === onlyId)
  if (onlyId && !due.length) throw new Error("This plan isn't ready yet")
  if (!day && !due.length) throw new Error("Nothing to collect yet")

  let next = s
  if (day) {
    next = credit(
      { ...next, streak: day, bestStreak: Math.max(next.bestStreak, day), lastClaimDay: dayOf(now) },
      { id: uid(now), at: now, coins: checkinCoins(day), kind: "checkin", streakDay: day },
    )
  }
  for (const o of due) {
    const claimed = o.claimed + 1
    next = credit(
      { ...next, owned: next.owned.map((x) => (x.id === o.id ? { ...x, claimed, lastClaimAt: now } : x)) },
      { id: uid(now), at: now, coins: getPlan(o.planId).perDay, kind: "claim", planId: o.planId, day: claimed },
    )
  }
  return next
}

/** Purchase validation: Free plan limit 1/1, paid plans limit 10/10 */
export function cantBuy(s: State, planId: PlanId): string | null {
  if (planId === "free") {
    if (s.owned.some((o) => o.planId === "free")) {
      return "Free plan can only be claimed once per user"
    }
  }
  const activeCount = s.owned.filter((o) => o.planId === planId && !isDone(o)).length
  if (activeCount >= 10) {
    return "Maximum limit reached for this plan (10/10)"
  }
  return null
}

/** Ensure at most one free plan ever exists in owned array */
export function sanitizeOwned(owned: Owned[]): Owned[] {
  let freeFound = false
  return owned.filter((o) => {
    if (o.planId === "free") {
      if (freeFound) return false
      freeFound = true
    }
    return true
  })
}

export function activatePlan(s: State, planId: PlanId, now: number, orderId?: string): State {
  // STRICT: Never allow multiple free plans in the same account
  if (planId === "free" && s.owned.some((o) => o.planId === "free")) {
    return { ...s, owned: sanitizeOwned(s.owned) }
  }
  const existingId = orderId || uid(now)
  if (s.owned.some((o) => o.id === existingId)) return { ...s, owned: sanitizeOwned(s.owned) }

  const owned: Owned = { id: existingId, planId, claimed: 0, boughtAt: now, lastClaimAt: null }
  return {
    ...s,
    owned: sanitizeOwned([owned, ...s.owned]),
    history: [
      { id: uid(now), at: now, coins: 0, kind: "buy", planId },
      ...s.history,
    ],
  }
}

export function buy(s: State, planId: PlanId, now: number): State {
  const reason = cantBuy(s, planId)
  if (reason) throw new Error(reason)
  const plan = getPlan(planId)
  if (plan.cost > 0 && s.coins < plan.cost) {
    throw new Error("Not enough coins")
  }
  const owned: Owned = { id: uid(now), planId, claimed: 0, boughtAt: now, lastClaimAt: null }
  const coinsDeduction = plan.cost > 0 ? -plan.cost : 0
  return credit(
    { ...s, owned: sanitizeOwned([owned, ...s.owned]) },
    { id: uid(now), at: now, coins: coinsDeduction, kind: "buy", planId }
  )
}

/** Processes a wallet withdrawal, deducting coins and recording the transaction */
export function withdraw(s: State, amount: number, now: number, method = "bank"): State {
  if (amount < WITHDRAW_MIN) throw new Error(`Minimum withdrawal is ₹${WITHDRAW_MIN}`)
  if (s.coins < amount) throw new Error("Withdrawal amount exceeds your available balance")
  if (!hasBoughtPaidPlan(s)) throw new Error("Pehle koi paid solar plan active karein")

  return {
    ...s,
    coins: s.coins - amount,
    history: [
      { id: uid(now), at: now, coins: -amount, kind: "withdraw", amount, method },
      ...s.history,
    ],
  }
}

export function invite(s: State, now: number): State {
  return credit({ ...s, invites: s.invites + 1 }, { id: uid(now), at: now, coins: INVITE_BONUS, kind: "invite" })
}

export function newPlayer(name: string, now: number, invitedBy?: string): State {
  const code = `${name.replace(/[^a-z]/gi, "").slice(0, 5).toUpperCase() || "PLAYER"}${(now % 900) + 100}`
  return credit(
    { name, coins: 0, lifetime: 0, owned: [], history: [], streak: 0, bestStreak: 0, lastClaimDay: null, inviteCode: code, invites: 0, skew: 0, invitedBy },
    { id: uid(now), at: now, coins: WELCOME_GIFT, kind: "welcome" },
  )
}

/**
 * A believable two-week-old player, built by playing the real rules:
 * one running plan, one missed day, one invite, and 59 coins ready today.
 */
export function demoPlayer(now: number): State {
  // ponytail: claims land at the same clock time each day; a load in the first minute after midnight sees yesterday as a gap
  const at = (d: number) => now + d * DAY_MS - 60_000
  let s = activatePlan(newPlayer("Rahul", at(-14)), "solar_300", at(-14))
  for (let d = -14; d < 0; d++) {
    if (d === -4) continue // a missed day: the streak starts over
    s = collect(s, at(d))
    if (d === -9) s = invite(s, at(d))
  }
  return s
}
