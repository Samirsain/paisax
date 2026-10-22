"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRightIcon, CheckCircle2Icon, ShoppingCartIcon } from "lucide-react"
import { BuySheet } from "@/components/buy-sheet"
import { Skeleton } from "@/components/marks"
import { PLANS, active, getPlan, type Plan, type PlanId } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function PlansPage() {
  const { ready: loaded, state } = useStore()
  const [buying, setBuying] = useState<PlanId | null>(null)
  const [filter, setFilter] = useState<"all" | "normal" | "vip">("all")

  if (!loaded) return <Skeleton />

  const running = active(state)
  const plans = PLANS.filter((p) => {
    if (filter === "all") return true
    if (filter === "vip") return p.category === "vip"
    return p.category === "normal"
  })

  return (
    <div className="flex flex-col gap-4 pt-1 pb-10 max-w-md mx-auto font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Solar Earning Plans</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Invest in solar energy, earn guaranteed daily returns. Higher capacity, higher returns!
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          {running.length} Active
        </span>
      </div>

      {/* Filter pills in Solar Yellow */}
      <div className="flex rounded-full bg-white p-1 border border-amber-200 shadow-xs">
        {(["all", "normal", "vip"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "flex-1 py-1.5 text-xs font-black rounded-full transition-all cursor-pointer capitalize",
              filter === tab
                ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {tab === "all" ? "All Plans" : `${tab} Plans`}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="flex flex-col gap-3.5">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} onBuy={() => setBuying(p.id)} />
        ))}
      </div>

      <BuySheet planId={buying} onClose={() => setBuying(null)} />
    </div>
  )
}

function PlanCard({ plan, onBuy }: { plan: Plan; onBuy: () => void }) {
  const { state } = useStore()
  const isFreeActive = plan.id === "free" && state.owned.some((o) => o.planId === "free")
  const totalReturn = plan.perDay * plan.days

  return (
    <article className="rounded-[28px] bg-white p-4.5 shadow-sm border border-amber-100 flex flex-col gap-3.5 transition-all hover:shadow-md hover:border-amber-300">
      
      {/* Title */}
      <h3 className="text-[19px] font-black text-[#0f172a] tracking-tight">
        {plan.name}
      </h3>

      {/* Middle Grid: Left Thumbnail + Right Metrics */}
      <div className="flex items-center gap-3.5">
        
        {/* Left Thumbnail with Limit 0/10 badge */}
        <div className="relative w-[140px] h-[105px] rounded-2xl overflow-hidden shrink-0 shadow-xs border border-amber-100 bg-amber-50/50">
          <Image
            src={plan.image || "/dairymilk/product.png"}
            alt={plan.name}
            fill
            className="object-cover"
          />
          {/* Limit badge on top-left corner */}
          <span className="absolute top-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-xs">
            {plan.limit || "Limit 0/10"}
          </span>
        </div>

        {/* Right Details with 4 rows separated by dashed lines */}
        <div className="flex-1 flex flex-col text-xs">
          
          {/* Row 1: Price */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Price
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(plan.cost)}
            </span>
          </div>

          {/* Row 2: Daily */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Daily
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(plan.perDay)}
            </span>
          </div>

          {/* Row 3: Total */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Total
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(totalReturn)}
            </span>
          </div>

          {/* Row 4: End day */}
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              End day
            </span>
            <span className="text-[15px] font-black text-slate-900">
              {plan.days} day
            </span>
          </div>
        </div>
      </div>

      {/* Full-width Buy Now CTA Button in Solar Yellow Gradient */}
      {isFreeActive ? (
        <div className="w-full mt-0.5 flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-2.5 px-4 text-emerald-800 text-xs font-black border border-emerald-200">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <span>Free Plan Already Active (Limit 1/1)</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          className="w-full mt-0.5 flex items-center justify-between rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-2.5 pl-6 pr-2.5 text-slate-950 font-black shadow-md shadow-amber-500/25 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span className="flex-1 text-center text-[15px] font-black tracking-tight flex items-center justify-center gap-1.5">
            {plan.cost === 0 ? "Activate Free Plan 🎁" : <>Buy Now <span className="text-base">🛒</span></>}
          </span>
          <span className="flex size-7.5 items-center justify-center rounded-full bg-slate-950 text-amber-400 shadow-xs shrink-0 font-black">
            &gt;
          </span>
        </button>
      )}
    </article>
  )
}
