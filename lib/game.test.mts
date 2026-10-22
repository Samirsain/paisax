// Run with: npm test
import assert from "node:assert/strict"
import { test } from "node:test"
import { DAY_MS, buy, cantBuy, checkinDay, collect, demoPlayer, isState, levelOf, liveStreak, newPlayer, readyCoins } from "./game.ts"

const t0 = new Date(2026, 9, 21, 9).getTime()

test("a new plan pays at once, then once per 24 hours, and finishes after 30 days", () => {
  let s = buy(newPlayer("Asha", t0), "jio", t0)
  assert.equal(s.coins, 0)
  s = collect(s, t0)
  assert.equal(s.coins, 5 + 39)
  assert.throws(() => collect(s, t0 + 3_600_000), /Nothing to collect/) // same day, plan not due
  for (let d = 1; d < 30; d++) s = collect(s, t0 + d * DAY_MS)
  assert.equal(s.owned[0].claimed, 30)
  assert.equal(cantBuy(s, "jio"), null) // finished, so it can be bought again
})

test("the check-in grows with the streak, caps at day 7, and a missed day starts over", () => {
  let s = newPlayer("Asha", t0)
  for (let d = 0; d < 9; d++) s = collect(s, t0 + d * DAY_MS)
  assert.equal(s.streak, 9)
  assert.equal(s.history[0].coins, 35)
  assert.equal(liveStreak(s, t0 + 10 * DAY_MS), 0)
  assert.equal(checkinDay(s, t0 + 10 * DAY_MS), 1)
  assert.equal(s.bestStreak, 9)
})

test("a running plan can't be bought twice and coins can't go negative", () => {
  const s = buy(newPlayer("Asha", t0), "jio", t0)
  assert.throws(() => buy(s, "jio", t0), /already running/)
  assert.throws(() => buy(s, "tesla", t0), /Not enough coins/)
})

test("levels follow lifetime coins, and spending never lowers them", () => {
  assert.deepEqual(levelOf(0), { level: 1, floor: 0, next: 400 })
  assert.equal(levelOf(800).level, 3)
  assert.equal(levelOf(99_999).next, null)
  const s = buy(newPlayer("Asha", t0), "jio", t0)
  assert.equal(s.coins, 0)
  assert.equal(s.lifetime, 599) // the welcome gift still counts after it's spent
  assert.equal(levelOf(s.lifetime).level, 2)
})

test("the demo player opens with 59 coins ready and a 3-day streak", () => {
  const now = t0 + 40 * DAY_MS
  const s = demoPlayer(now)
  assert.equal(liveStreak(s, now), 3)
  assert.equal(readyCoins(s, now), 59)
  assert.equal(s.owned.length, 1)
  assert.ok(s.coins >= 0)
})

test("a single plan can be claimed on its own, and the check-in rides along once", () => {
  let s = { ...newPlayer("Asha", t0), coins: 1600 }
  s = { ...buy(buy(s, "jio", t0), "airtel", t0 + 1), coins: 0 }
  const jio = s.owned.find((o) => o.planId === "jio")!
  s = collect(s, t0 + 2, jio.id)
  assert.equal(s.coins, 5 + 39)
  assert.throws(() => collect(s, t0 + 3, jio.id), /isn't ready/)
  s = collect(s, t0 + 4)
  assert.equal(s.coins, 5 + 39 + 66)
})

test("a saved game from an older build is rejected instead of crashing the app", () => {
  const good = demoPlayer(t0)
  assert.equal(isState(JSON.parse(JSON.stringify(good))), true)
  const oldPlan = { ...good, owned: [{ ...good.owned[0], planId: "marigold" }] }
  assert.equal(isState(oldPlan), false)
  assert.equal(isState({ ...good, coins: "12" }), false)
  assert.equal(isState(null), false)
})

test("a player who arrives from an invite link keeps the inviter's code", () => {
  assert.equal(newPlayer("Asha", t0, "RAHUL123").invitedBy, "RAHUL123")
  assert.equal(newPlayer("Asha", t0).invitedBy, undefined)
})
