"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  FlameIcon,
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

export default function MyPlansPage() {
  const { ready: loaded, state, now, collect } = useStore()
  const [tab, setTab] = useState<"active" | "completed">("active")
  const [countdown, setCountdown] = useState("00:00:00")

  // Live countdown to midnight (Next income time)
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

  const totalInvested = running.reduce((sum, o) => sum + getPlan(o.planId).cost, 0)
  const dailyIncome = running.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)
  const activeCount = running.length

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP HEADER BANNER (Solar Gradient) ────────────────────────── */}
      <div className="relative -mx-3.5 px-4 pt-6 pb-12 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white text-center overflow-hidden">
        {/* Decorative solar rays / ambient background blur */}
        <div className="absolute -top-12 -right-12 size-44 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-amber-900/30 blur-xl pointer-events-none" />

        <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
          My Orders
        </h1>

        {/* Live Income Time Pill Badge */}
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 shadow-inner">
          <ClockIcon className="size-3.5 text-yellow-300 animate-pulse" />
          <span className="text-xs font-semibold text-amber-100">Income Time</span>
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
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs">
              <WalletIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              ₹{fmt(totalInvested)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Total Invested
            </p>
          </div>

          {/* Daily Income */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-xs">
              <TrendingUpIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-emerald-600 leading-tight">
              ₹{fmt(dailyIncome)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Daily Income
            </p>
          </div>

          {/* Active plans */}
          <div className="flex flex-col items-center px-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 text-white shadow-xs">
              <ZapIcon className="size-5" />
            </span>
            <p className="mt-2 text-base font-black text-slate-900 leading-tight">
              {activeCount}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Active plans
            </p>
          </div>

        </div>
      </div>

      {/* ── TAB SELECTOR (Active Plans vs Completed) ─────────────────── */}
      <div className="flex rounded-full bg-white p-1 border border-amber-200/80 shadow-xs mt-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={cn(
            "flex-1 py-2 text-xs font-black rounded-full transition-all cursor-pointer",
            tab === "active"
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm"
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
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Completed ({finished.length})
        </button>
      </div>

      {/* ── PLANS CONTENT ────────────────────────────────────────────── */}
      {tab === "active" ? (
        running.length === 0 ? (
          /* Empty State matching screenshot */
          <div className="rounded-[32px] bg-white p-8 text-center shadow-lg shadow-amber-950/5 border border-amber-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200/70 shadow-inner">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-md">
                <PackageOpenIcon className="size-6.5" />
              </span>
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              No plans yet
            </h2>
            <p className="mt-1.5 max-w-[250px] text-xs font-medium text-slate-500 leading-relaxed">
              You haven&apos;t purchased any plan yet. Explore the plans and start earning daily.
            </p>

            <Link
              href="/plans"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-500/30 transition-all hover:opacity-95 active:scale-95"
            >
              <span>Explore plans</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          /* List of Active Plan Cards */
          <div className="flex flex-col gap-3.5">
            {running.map((o) => (
              <SolarPlanOrderCard key={o.id} owned={o} onClaim={collect} />
            ))}
          </div>
        )
      ) : (
        finished.length === 0 ? (
          <div className="rounded-[32px] bg-white p-8 text-center shadow-md border border-amber-100 flex flex-col items-center justify-center min-h-[220px]">
            <p className="text-base font-bold text-slate-800">No completed plans yet</p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Plans run for their full cycle, delivering your daily returns directly to your wallet.
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

    </div>
  )
}

function SolarPlanOrderCard({
  owned: o,
  onClaim,
}: {
  owned: Owned
  onClaim: (id: string) => number
}) {
  const { now, state } = useStore()
  const plan = getPlan(o.planId)
  const isDue = ready(state, now).some((x) => x.id === o.id)
  const progressPercent = Math.min(100, Math.round((o.claimed / plan.days) * 100))

  function handleClaim() {
    const coins = onClaim(o.id)
    toast.success(`Claimed ₹${fmt(coins)}!`, {
      description: `${plan.name} return credited to your wallet.`,
    })
  }

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm border border-amber-200/80 hover:shadow-md transition-shadow">
      {/* Top row: Title + Active Badge */}
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-100">
        <div>
          <h3 className="text-sm font-black text-slate-900">{plan.name}</h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Invested ₹{fmt(plan.cost)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
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
            <p className="text-[10px] font-semibold text-slate-400">Daily Return</p>
            <p className="text-sm font-black text-emerald-600">₹{fmt(plan.perDay)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Total Return</p>
            <p className="text-sm font-black text-amber-700">₹{fmt(plan.perDay * plan.days)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Days Claimed</p>
            <p className="font-bold text-slate-800">{o.claimed} / {plan.days} d</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">Remaining</p>
            <p className="font-bold text-slate-800">{plan.days - o.claimed} days</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>Progress</span>
          <span className="text-amber-700">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Claim / Status CTA */}
      <div className="mt-3.5">
        {isDue ? (
          <Button
            variant="buy"
            size="lg"
            onClick={handleClaim}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <CoinsIcon className="size-4" />
            Claim Today&apos;s Return (₹{fmt(plan.perDay)})
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-full bg-slate-100 py-2.5 px-4 text-xs font-bold text-slate-600 border border-slate-200/70">
            <CheckCircle2Icon className="size-4 text-emerald-600" />
            <span>Today&apos;s Return Claimed · Next after 00:00</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SolarCompletedCard({ owned: o }: { owned: Owned }) {
  const plan = getPlan(o.planId)
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-xs border border-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700">{plan.name}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          Completed
        </span>
      </div>
      <div className="mt-2.5 flex justify-between items-center text-xs">
        <div>
          <p className="text-[10px] text-slate-400">Total Earned</p>
          <p className="text-base font-black text-emerald-600">₹{fmt(o.claimed * plan.perDay)}</p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Full {plan.days} days completed
        </p>
      </div>
    </div>
  )
}
