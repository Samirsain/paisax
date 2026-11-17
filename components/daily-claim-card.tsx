"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ZapIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ClockIcon,
  CoinsIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useStore, fmt } from "@/lib/store"
import {
  active,
  ready,
  getPlan,
  nextISTMidnight,
  isClaimedToday,
  isDone,
  type Owned,
} from "@/lib/game"
import { cn } from "@/lib/utils"

/**
 * DailyClaimCard — Prominent card on the Home Page to claim ALL
 * active plan daily returns in one tap. Calls the server-authoritative
 * POST /api/game/claim endpoint with claimAll: true.
 */
export function DailyClaimCard() {
  const { state, now, syncWithServer, applyServerState } = useStore()
  const [claiming, setClaiming] = useState(false)
  const [countdown, setCountdown] = useState("")

  // Live IST midnight countdown
  useEffect(() => {
    function tick() {
      const nextMidnight = nextISTMidnight(Date.now())
      const diff = Math.max(0, nextMidnight - Date.now())
      const h = Math.floor(diff / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0")
      const m = Math.floor((diff / (1000 * 60)) % 60)
        .toString()
        .padStart(2, "0")
      const s = Math.floor((diff / 1000) % 60)
        .toString()
        .padStart(2, "0")
      setCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  // Gather active plans info
  const activePlans = active(state)
  const duePlans = ready(state, now)
  const dueCoins = duePlans.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)

  // Total daily income across all active plans
  const totalDailyIncome = activePlans.reduce(
    (sum, o) => sum + getPlan(o.planId).perDay,
    0
  )

  // All claimed today? (active plans that are not done and already claimed today)
  const claimedTodayPlans = activePlans.filter(
    (o) => !isDone(o) && isClaimedToday(o, now)
  )
  const allClaimedToday =
    activePlans.length > 0 &&
    duePlans.length === 0 &&
    claimedTodayPlans.length > 0

  // Don't show card if no active plans at all
  if (activePlans.length === 0) return null

  async function handleClaimAll() {
    if (duePlans.length === 0 || claiming) return
    setClaiming(true)
    try {
      const res = await fetch("/api/game/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimAll: true }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.serverState && typeof applyServerState === "function") {
          applyServerState(data.serverState)
        }
        await syncWithServer().catch(() => {})
        throw new Error(data.error || data.message || "Failed to claim rewards")
      }

      // Apply server-authoritative state immediately
      if (data.serverState && typeof applyServerState === "function") {
        applyServerState(data.serverState)
      }
      await syncWithServer().catch(() => {})

      toast.success(
        data.message ||
          `🎉 Claimed ₹${fmt(data.claimedCoins)} from ${data.claimedCount} plan(s)!`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Claim failed"
      toast.error(msg)
      await syncWithServer().catch(() => {})
    } finally {
      setClaiming(false)
    }
  }

  // ── READY TO CLAIM STATE ──────────────────────────────────────────
  if (duePlans.length > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 p-4 shadow-lg shadow-amber-500/20">
        {/* Background glow */}
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-yellow-300/30 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          {/* Left side: Icon + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-amber-400 shadow-md">
              <ZapIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-slate-950 uppercase tracking-wide">
                🎁 Daily Reward Ready
              </p>
              <p className="text-lg font-black text-slate-950 leading-tight">
                ₹{fmt(dueCoins)}
              </p>
              <p className="text-[10px] font-bold text-amber-900/80 truncate">
                {duePlans.length} plan{duePlans.length > 1 ? "s" : ""} · Claim
                karein aur wallet mein turant credit paayein
              </p>
            </div>
          </div>

          {/* Claim button */}
          <button
            type="button"
            disabled={claiming}
            onClick={handleClaimAll}
            className="shrink-0 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-amber-300 shadow-md hover:bg-slate-900 active:scale-95 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {claiming ? (
              <span className="flex items-center gap-1.5">
                <Loader2Icon className="size-3.5 animate-spin" />
                Claiming…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CoinsIcon className="size-3.5" />
                Claim ₹{fmt(dueCoins)}
              </span>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── ALL CLAIMED TODAY STATE ───────────────────────────────────────
  if (allClaimedToday) {
    return (
      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-emerald-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-800">
                ✅ Today's ₹{fmt(totalDailyIncome)} Claimed
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                Next reward unlocks at midnight IST
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5">
              <ClockIcon className="size-3 text-amber-500" />
              <span className="font-mono text-xs font-black text-slate-700 tracking-wider">
                {countdown}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── WAITING STATE (plans active but not ready yet) ────────────────
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-amber-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <ClockIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black text-slate-800">
              Daily Reward: ₹{fmt(totalDailyIncome)}/day
            </p>
            <p className="text-[10px] font-medium text-slate-500">
              {activePlans.length} active plan{activePlans.length > 1 ? "s" : ""}{" "}
              · Next reward at midnight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 shrink-0">
          <ClockIcon className="size-3 text-amber-500" />
          <span className="font-mono text-xs font-black text-amber-700 tracking-wider">
            {countdown}
          </span>
        </div>
      </div>
    </div>
  )
}

