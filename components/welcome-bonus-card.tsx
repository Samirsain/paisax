"use client"

import { useState } from "react"
import Link from "next/link"
import {
  GiftIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
  SparklesIcon,
  ArrowRightIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useStore, fmt } from "@/lib/store"
import { dayOf, isDone, nextClaimAt, isClaimedToday, getPlan } from "@/lib/game"
import { cn } from "@/lib/utils"

export function WelcomeBonusCard() {
  const { state, claim, now, syncWithServer, applyServerState } = useStore()
  const [claiming, setClaiming] = useState(false)

  // Find user's free welcome plan
  const freePlanItem = state.owned.find((o) => o.planId === "free" && o.status !== "deactivated")

  // If no free plan found, don't crash
  if (!freePlanItem) return null

  const claimedDays = Math.min(4, freePlanItem.claimed || 0)
  const totalEarnedFromBonus = claimedDays * 50
  const isCompleted = claimedDays >= 4 || isDone(freePlanItem)

  // Check if today's reward is ready to collect
  const currentTime = now || Date.now()
  const alreadyClaimedToday = isClaimedToday(freePlanItem, currentTime)
  const readyAt = nextClaimAt(freePlanItem)
  const isReadyToClaim =
    !isCompleted && !alreadyClaimedToday && readyAt !== null && currentTime >= readyAt

  // Day currently being claimed (1, 2, 3, or 4)
  const nextDayToClaim = claimedDays + 1

  async function handleClaimDailyBonus() {
    if (!freePlanItem || !isReadyToClaim || claiming) return

    setClaiming(true)
    try {
      // 1. Call server API
      const res = await fetch("/api/game/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planInstanceId: freePlanItem.id,
          claimAll: false,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to collect daily bonus")
      }

      // 2. Update store directly with authoritative server state
      if (data.serverState && typeof applyServerState === "function") {
        applyServerState(data.serverState)
      } else if (typeof claim === "function") {
        claim(freePlanItem.id)
      }
      await syncWithServer().catch(() => {})

      toast.success(`🎁 Day ${nextDayToClaim} Welcome Bonus (₹50) credited to your wallet!`, {
        description: `Total bonus claimed: ₹${fmt(totalEarnedFromBonus + 50)} / ₹200`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Claim failed"
      toast.error(msg)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1c1206] via-[#241608] to-[#120a03] p-4 text-white shadow-xl border border-amber-500/40">
      
      {/* Ambient background glows */}
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-yellow-400/15 blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/30">
            <GiftIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white tracking-tight">
                ₹200 Welcome Bonus
              </h3>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[9px] font-black uppercase text-amber-300 border border-amber-400/40">
                ₹50 / Day
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80 font-medium">
              Daily reward unlocked for new registered investors
            </p>
          </div>
        </div>

        {/* Claimed Score Pill */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Collected
          </span>
          <span className="text-sm font-black text-yellow-300 font-mono">
            ₹{totalEarnedFromBonus}<span className="text-slate-400 text-xs">/₹200</span>
          </span>
        </div>
      </div>

      {/* ── 4-DAY PROGRESS STEPS ───────────────────────────────────── */}
      <div className="mt-3.5 grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((dayNum) => {
          const isClaimed = claimedDays >= dayNum
          const isCurrentActive = !isCompleted && dayNum === nextDayToClaim

          return (
            <div
              key={dayNum}
              className={cn(
                "relative rounded-xl p-2 text-center transition-all border flex flex-col items-center justify-between min-h-[64px]",
                isClaimed
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : isCurrentActive && isReadyToClaim
                  ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-amber-200 animate-pulse"
                  : "bg-black/30 border-white/10 text-slate-400"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold">Day {dayNum}</span>
                {isClaimed ? (
                  <CheckCircle2Icon className="size-3 text-emerald-400" />
                ) : isCurrentActive && isReadyToClaim ? (
                  <SparklesIcon className="size-3 text-yellow-300" />
                ) : (
                  <LockIcon className="size-2.5 text-slate-500" />
                )}
              </div>

              <span
                className={cn(
                  "text-xs font-black my-1",
                  isClaimed
                    ? "text-emerald-400"
                    : isCurrentActive
                    ? "text-yellow-300"
                    : "text-slate-400"
                )}
              >
                ₹50
              </span>

              <span
                className={cn(
                  "text-[9px] font-extrabold uppercase tracking-tight block",
                  isClaimed
                    ? "text-emerald-400"
                    : isCurrentActive && isReadyToClaim
                    ? "text-yellow-300"
                    : "text-slate-500"
                )}
              >
                {isClaimed ? "Done" : isCurrentActive && isReadyToClaim ? "Ready!" : "Locked"}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── ACTION BUTTON / STATUS ─────────────────────────────────── */}
      <div className="mt-3">
        {isReadyToClaim ? (
          <button
            type="button"
            onClick={handleClaimDailyBonus}
            disabled={claiming}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 py-3 px-4 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/30 active:scale-98 transition-all hover:opacity-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            <SparklesIcon className="size-4 text-slate-950 animate-spin" />
            <span>
              {claiming
                ? "Collecting Bonus…"
                : `🎁 Collect Day ${nextDayToClaim} Bonus (₹50)`}
            </span>
          </button>
        ) : isCompleted ? (
          <div className="rounded-2xl bg-emerald-950/40 p-2.5 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2Icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-black text-emerald-300">
                  All ₹200 Bonus Collected!
                </p>
                <p className="text-[10px] text-emerald-400/80">
                  Ready to withdraw with any active solar plan
                </p>
              </div>
            </div>

            <Link
              href="/wallet/withdraw"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-[11px] font-black active:scale-95 transition-all shadow-sm"
            >
              Withdraw →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/40 p-2.5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ClockIcon className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">
                  Today's ₹50 Bonus Claimed
                </p>
                <p className="text-[10px] text-slate-400">
                  Day {nextDayToClaim} unlocks at midnight (00:00:00)
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-300">
              Next: Day {nextDayToClaim}
            </span>
          </div>
        )}
      </div>

      {/* Mandatory Condition Notice */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <ZapIcon className="size-3 text-amber-400" />
          <span>Withdrawal unlock ke liye koi bhi plan khareedein</span>
        </span>
        <Link
          href="/plans"
          className="text-amber-300 hover:text-amber-200 font-extrabold underline underline-offset-2 flex items-center gap-0.5"
        >
          <span>Plans Dekhein</span>
          <ArrowRightIcon className="size-2.5" />
        </Link>
      </div>

    </div>
  )
}
