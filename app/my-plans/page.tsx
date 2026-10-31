"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  PackageOpenIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { active, completed, getPlan, ready, type Owned } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ClaimRewardModal } from "@/components/claim-modal"

export default function MyPlansPage() {
  const { ready: loaded, state, now, collect } = useStore()
  const [tab, setTab] = useState<"active" | "completed">("active")
  const [countdown, setCountdown] = useState("00:00:00")
  const [claimedReward, setClaimedReward] = useState<{ planName: string; coins: number; day?: number; totalDays?: number } | null>(null)

  // Live countdown to midnight (Next income cycle)
  useEffect(() => {
    function updateTimer() {
      const current = new Date()
      const midnight = new Date(current)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.max(0, midnight.getTime() - current.getTime())
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, "0")
      const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, "0")
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, "0")
      setCountdown(`${h}:${m}:${s}`)
    }
    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!loaded) return <Skeleton />

  const running = active(state)
  const finished = completed(state)
  const dueList = ready(state, now)
  const dueTotal = dueList.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)

  const totalInvested = running.reduce((sum, o) => sum + getPlan(o.planId).cost, 0)
  const dailyIncome = running.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)
  const activeCount = running.length

  // Claim all ready plans in 1 tap
  function handleClaimAll() {
    if (dueList.length === 0) return
    const coins = collect()
    setClaimedReward({
      planName: dueList.length > 1 ? `${dueList.length} Solar Plans` : getPlan(dueList[0].planId).name,
      coins,
    })
    toast.success(`Claimed ₹${fmt(coins)} from daily solar returns!`)
  }

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP HEADER BANNER (Solar Gradient) ────────────────────────── */}
      <div className="relative -mx-3.5 px-4 pt-6 pb-12 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white text-center overflow-hidden">
        <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
          My Solar Orders
        </h1>

        {/* Live Income Time Pill Badge */}
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 shadow-inner">
          <ClockIcon className="size-3.5 text-yellow-300 animate-pulse" />
          <span className="text-xs font-semibold text-amber-100">Next Payout Cycle:</span>
          <span className="font-mono text-xs font-black tracking-wider text-white">
            {countdown}
          </span>
        </div>
      </div>

      {/* ── 3 METRICS STAT CARD (Overlapping Header) ───────────────────── */}
      <div className="relative -mt-8 mx-1 rounded-[26px] bg-white p-4 shadow-xl shadow-amber-950/5 border border-amber-100/80">
        <div className="grid grid-cols-3 divide-x divide-amber-100/80 text-center">
          
          {/* Total Invested */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
              <WalletIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              ₹{fmt(totalInvested)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Total Invested
            </p>
          </div>

          {/* Daily Income */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <TrendingUpIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-emerald-600 leading-tight">
              ₹{fmt(dailyIncome)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Daily Return
            </p>
          </div>

          {/* Active plans */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
              <ZapIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              {activeCount}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Active Plans
            </p>
          </div>

        </div>
      </div>

      {/* ── MASTER CLAIM-ALL BANNER (When 1 or more plans are due) ─────── */}
      {dueList.length > 0 && (
        <div className="mx-1 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 p-4 shadow-lg shadow-amber-500/20 border border-amber-300 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-amber-400 font-black shadow-xs shrink-0">
              <ZapIcon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-black text-slate-950">
                {dueList.length} Return{dueList.length > 1 ? "s" : ""} Ready to Claim!
              </p>
              <p className="text-xs font-bold text-amber-950">
                Total ₹{fmt(dueTotal)} waiting to collect
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClaimAll}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-amber-300 shadow-md hover:bg-slate-900 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            Claim All (₹{fmt(dueTotal)})
          </button>
        </div>
      )}

      {/* ── TAB SELECTOR (Active Plans vs Completed) ─────────────────── */}
      <div className="flex rounded-full bg-white p-1 border border-amber-200/80 shadow-xs mt-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={cn(
            "flex-1 py-2 text-xs font-black rounded-full transition-all cursor-pointer",
            tab === "active"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Active Plans ({running.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={cn(
            "flex-1 py-2 text-xs font-black rounded-full transition-all cursor-pointer",
            tab === "completed"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Completed ({finished.length})
        </button>
      </div>

      {/* ── PLANS CONTENT ────────────────────────────────────────────── */}
      {tab === "active" ? (
        running.length === 0 ? (
          /* Empty State */
          <div className="rounded-[32px] bg-white p-8 text-center shadow-lg shadow-amber-950/5 border border-amber-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200/70 shadow-inner">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <PackageOpenIcon className="size-6.5" />
              </span>
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              No active plans
            </h2>
            <p className="mt-1.5 max-w-[250px] text-xs font-medium text-slate-500 leading-relaxed">
              You haven&apos;t started any solar plan yet. Activate the Free Plan or explore solar generators to earn daily returns.
            </p>

            <Link
              href="/plans"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 px-7 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:opacity-95 active:scale-95"
            >
              <span>Explore Earning Plans</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          /* List of Active Plan Cards */
          <div className="flex flex-col gap-3.5">
            {running.map((o) => (
              <SolarPlanOrderCard
                key={o.id}
                owned={o}
                countdown={countdown}
                onClaim={collect}
                onReward={(planName, coins, day, totalDays) =>
                  setClaimedReward({ planName, coins, day, totalDays })
                }
              />
            ))}
          </div>
        )
      ) : (
        finished.length === 0 ? (
          <div className="rounded-[32px] bg-white p-8 text-center shadow-md border border-amber-100 flex flex-col items-center justify-center min-h-[220px]">
            <p className="text-base font-bold text-slate-800">No completed plans yet</p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Plans run for their exact lifecycle, delivering your daily returns directly to your wallet every day.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {finished.map((o) => (
              <SolarCompletedCard key={o.id} owned={o} />
            ))}
          </div>
        )
      )}

      {/* Quick link to explore more plans */}
      {running.length > 0 && (
        <div className="mt-2 text-center">
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 hover:text-amber-800 underline underline-offset-4"
          >
            <span>+ Buy another Solar Plan</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      )}

      {/* ── IMPECCABLE CLAIM REWARD CELEBRATION MODAL ── */}
      <ClaimRewardModal
        reward={claimedReward}
        onClose={() => setClaimedReward(null)}
      />

    </div>
  )
}

function SolarPlanOrderCard({
  owned: o,
  countdown,
  onClaim,
  onReward,
}: {
  owned: Owned
  countdown: string
  onClaim: (id: string) => number
  onReward: (planName: string, coins: number, day?: number, totalDays?: number) => void
}) {
  const { now, state } = useStore()
  const plan = getPlan(o.planId)
  const isDue = ready(state, now).some((x) => x.id === o.id)
  const progressPercent = Math.min(100, Math.round((o.claimed / plan.days) * 100))
  const remainingDays = Math.max(0, plan.days - o.claimed)

  function handleClaim() {
    const coins = onClaim(o.id)
    onReward(plan.name, coins, o.claimed + 1, plan.days)
    toast.success(`Claimed ₹${fmt(coins)} from ${plan.name}!`)
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-amber-200/80 hover:shadow-md transition-shadow">
      
      {/* Top row: Plan Title + Status Badge */}
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-100">
        <div>
          <h3 className="text-sm font-black text-slate-900">{plan.name}</h3>
          <p className="text-xs text-slate-500 font-medium">
            Invested ₹{fmt(plan.cost)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-900 border border-amber-300 animate-pulse">
              <ZapIcon className="size-3 text-amber-700" />
              Ready
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
      </div>

      {/* Middle row: Thumbnail + Details */}
      <div className="mt-3 flex gap-3.5 items-center">
        <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden border border-amber-200 bg-amber-50">
          <Image
            src={plan.image || "/dairymilk/product.png"}
            alt={plan.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-xs font-semibold text-slate-400">Daily Return</p>
            <p className="text-sm font-black text-emerald-600">₹{fmt(plan.perDay)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Earned</p>
            <p className="text-sm font-black text-amber-700">₹{fmt(o.claimed * plan.perDay)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Days Claimed</p>
            <p className="font-bold text-slate-800">{o.claimed} / {plan.days} d</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Remaining</p>
            <p className="font-bold text-slate-800">{remainingDays} days</p>
          </div>
        </div>
      </div>

      {/* Progress Bar with Day Count */}
      <div className="mt-3">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
          <span>Cycle Progress</span>
          <span className="text-amber-800 font-black">{progressPercent}% ({o.claimed}/{plan.days} days)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Claim / Status CTA (High Contrast, Impeccable Button) */}
      <div className="mt-3.5">
        {isDue ? (
          <button
            type="button"
            onClick={handleClaim}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 py-3 px-4 text-xs font-black text-slate-950 shadow-md shadow-amber-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <CoinsIcon className="size-4 text-slate-950" />
            <span>Claim Today&apos;s Return (₹{fmt(plan.perDay)})</span>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 py-2.5 px-3.5 text-xs font-bold text-emerald-900 border border-emerald-200/60">
            <div className="flex items-center gap-1.5">
              <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
              <span>Today&apos;s Return Claimed</span>
            </div>
            <span className="font-mono text-xs font-black text-emerald-700">
              Next in {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function SolarCompletedCard({ owned: o }: { owned: Owned }) {
  const plan = getPlan(o.planId)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700">{plan.name}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
          Completed
        </span>
      </div>
      <div className="mt-2.5 flex justify-between items-center text-xs">
        <div>
          <p className="text-xs text-slate-400">Total Earned</p>
          <p className="text-base font-black text-emerald-600">₹{fmt(o.claimed * plan.perDay)}</p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Full {plan.days} days completed ({plan.days * plan.perDay} total)
        </p>
      </div>
    </div>
  )
}
