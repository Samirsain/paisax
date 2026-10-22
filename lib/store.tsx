"use client"

import { useSyncExternalStore, useEffect } from "react"
import * as game from "@/lib/game"
import type { PlanId, State } from "@/lib/game"

const KEY = "paisax:v1"

let state: State | null = null
let clock = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Read the invite code from the URL on first visit (e.g. ?invite=ABC123). */
function readInviteCode(): string | null {
  try {
    return new URLSearchParams(location.search).get("invite")
  } catch {
    return null
  }
}

function getState(): State {
  if (state === null) {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null")
      if (game.isState(saved)) {
        state = { ...saved, owned: game.sanitizeOwned(saved.owned) }
      } else {
        // New player: capture invite code from URL if present
        const inviteFrom = readInviteCode()
        state = game.newPlayer("Player", Date.now(), inviteFrom ?? undefined)
      }
    } catch {
      state = game.demoPlayer(Date.now())
    }
  }
  return state!
}

/** The game's clock: real time plus whatever the demo skipped ahead. */
const tick = () => (clock = Date.now() + getState().skew)
const getClock = () => clock || tick()

function subscribe(listener: () => void) {
  listeners.add(listener)
  timer ??= setInterval(() => {
    tick()
    emit()
  }, 15_000)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

/** Set when earning coins lifts the player a level; the shell celebrates it, then clears it. */
let levelUp: { from: number; to: number; lifetime: number } | null = null

function commit(fn: (s: State, now: number) => State) {
  state = fn(getState(), tick())
  tick() // skew may have changed
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: the game keeps running in memory
  }
  emit()
}

/** Commits a change that earns coins and returns how many; flags a level-up for the celebration. */
function earn(fn: (s: State, now: number) => State) {
  const before = getState()
  const from = game.levelOf(before.lifetime).level
  commit(fn)
  const after = getState()
  const to = game.levelOf(after.lifetime).level
  if (to > from) {
    levelUp = { from, to, lifetime: after.lifetime }
    emit()
  }
  return after.coins - before.coins
}

/** Synchronizes client state with the database (pending orders & backup) */
let syncInitialized = false
export async function syncWithServer() {
  if (typeof window === "undefined") return
  try {
    const res = await fetch("/api/game/sync")
    if (!res.ok) return
    const data = await res.json()
    if (!data.authenticated) return

    const currentState = getState()
    let updated = false
    let nextState = currentState

    // Sync player name and invite code from auth account
    if (data.user?.name && (nextState.name === "Player" || nextState.name === "Rahul")) {
      nextState = { ...nextState, name: data.user.name, inviteCode: data.user.inviteCode || nextState.inviteCode }
      updated = true
    }

    // Check confirmed paid orders from database and activate them if missing
    if (Array.isArray(data.confirmedOrders)) {
      for (const order of data.confirmedOrders) {
        if (order.planId === "recharge") {
          const alreadyCredited = nextState.history.some((h) => h.id === order.orderId)
          if (!alreadyCredited) {
            const boughtTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
            nextState = {
              ...nextState,
              coins: nextState.coins + order.amount,
              lifetime: nextState.lifetime + order.amount,
              history: [
                { id: order.orderId, at: boughtTime, coins: order.amount, kind: "welcome" },
                ...nextState.history,
              ],
            }
            updated = true
          }
        } else {
          const alreadyHasOrder = nextState.owned.some((o) => o.id === order.orderId)
          if (!alreadyHasOrder && game.PLANS.some((p) => p.id === order.planId)) {
            const boughtTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
            nextState = game.activatePlan(nextState, order.planId as PlanId, boughtTime, order.orderId)
            updated = true
          }
        }
      }
    }

    if (updated) {
      commit(() => nextState)
    }

    // Persist backup state to database
    fetch("/api/game/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: getState() }),
    }).catch(() => {})
  } catch {
    // Graceful offline fallback
  }
}

const actions = {
  /** Claims today's check-in plus every ready plan, or one plan; returns the coins collected. */
  collect: (onlyId?: string) => earn((s, t) => game.collect(s, t, onlyId)),
  buy: (planId: PlanId) => commit((s, t) => game.buy(s, planId, t)),
  activatePlan: (planId: PlanId, orderId?: string) => commit((s, t) => game.activatePlan(s, planId, t, orderId)),
  withdraw: (amount: number, method = "upi") => commit((s, t) => game.withdraw(s, amount, t, method)),
  invite: () => earn(game.invite),
  rename: (name: string) => commit((s) => ({ ...s, name })),
  skipDay: () => commit((s) => ({ ...s, skew: s.skew + game.DAY_MS })),
  startFresh: () => commit((s) => game.newPlayer(s.name, Date.now())),
  restoreDemo: () => commit(() => game.demoPlayer(Date.now())),
  syncWithServer,
}

export function useLevelUp() {
  const current = useSyncExternalStore(subscribe, () => levelUp, () => null)
  return {
    levelUp: current,
    dismiss: () => {
      levelUp = null
      emit()
    },
  }
}

/** Server render and hydration see `ready: false`; the browser snapshot follows. */
export function useStore() {
  const s = useSyncExternalStore(subscribe, getState, () => null)
  const now = useSyncExternalStore(subscribe, getClock, () => 0)

  useEffect(() => {
    if (!syncInitialized) {
      syncInitialized = true
      syncWithServer()
      const syncInterval = setInterval(syncWithServer, 20_000)
      return () => clearInterval(syncInterval)
    }
  }, [])

  return { ready: s !== null, now, state: s ?? game.newPlayer("Rahul", 0), ...actions }
}

const num = new Intl.NumberFormat("en-IN")
export const fmt = (n: number) => num.format(n)

const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" })
const date = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" })

/** "9:41 am today", "9:41 am tomorrow" or "9:41 am Fri 23 Oct": a plain time, never a countdown. */
export function when(at: number, now: number) {
  const gap = game.dayOf(at) - game.dayOf(now)
  return `${time.format(at)} ${gap === 0 ? "today" : gap === 1 ? "tomorrow" : date.format(at)}`
}

export function dayLabel(at: number, now: number) {
  const gap = game.dayOf(now) - game.dayOf(at)
  return gap === 0 ? "Today" : gap === 1 ? "Yesterday" : date.format(at)
}

export const clockTime = (at: number) => time.format(at)
