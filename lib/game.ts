// Pure game rules for PaisaX. Daily earnings and streak logic.

export type PlanId = "jio" | "airtel" | "tata" | "tesla"

export interface Plan {
  id: PlanId
  name: string
  tag: string
  blurb: string
  cost: number
  perDay: number
  days: number
}

export const PLANS: Plan[] = [
  { id: "jio", name: "Jio", tag: "Best for beginners", blurb: "Start earning daily with India's most trusted network", cost: 599, perDay: 39, days: 30 },
  { id: "airtel", name: "Airtel", tag: "Most popular", blurb: "Supercharge your daily income with premium returns", cost: 999, perDay: 66, days: 30 },
  { id: "tata", name: "Tata", tag: "High returns", blurb: "Unlock powerful daily earnings backed by Tata trust", cost: 1499, perDay: 99, days: 30 },
  { id: "tesla", name: "Tesla", tag: "Maximum profit", blurb: "The ultimate plan for maximum daily profit potential", cost: 1999, perDay: 133, days: 30 },
]

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id)!
const isPlanId = (id: unknown): id is PlanId => PLANS.some((p) => p.id === id)

export const WELCOME_GIFT = 599
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

/** When this plan pays next, or null once all its days are claimed. */
export function nextClaimAt(o: Owned): number | null {
  if (isDone(o)) return null
  return o.lastClaimAt === null ? o.boughtAt : o.lastClaimAt + DAY_MS
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

/** Why a plan can't be bought right now, or null when it can. */
export function cantBuy(s: State, planId: PlanId) {
  if (active(s).some((o) => o.planId === planId)) return "running" as const
  if (s.coins < getPlan(planId).cost) return "short" as const
  return null
}

export function buy(s: State, planId: PlanId, now: number): State {
  const why = cantBuy(s, planId)
  if (why === "running") throw new Error("This plan is already running")
  if (why === "short") throw new Error("Not enough coins")
  const plan = getPlan(planId)
  const owned: Owned = { id: uid(now), planId, claimed: 0, boughtAt: now, lastClaimAt: null }
  return credit({ ...s, owned: [owned, ...s.owned] }, { id: uid(now), at: now, coins: -plan.cost, kind: "buy", planId })
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
  let s = buy(newPlayer("Rahul", at(-14)), "jio", at(-14))
  for (let d = -14; d < 0; d++) {
    if (d === -4) continue // a missed day: the streak starts over
    s = collect(s, at(d))
    if (d === -9) s = invite(s, at(d))
  }
  return s
}
