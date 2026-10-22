"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowRightIcon, InfoIcon } from "lucide-react"
import { BuySheet } from "@/components/buy-sheet"
import { Chip, CoinIcon, Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { PLANS, active, cantBuy, getPlan, type PlanId } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { card, cn } from "@/lib/utils"

/** Promotional banner images — shown as a slim brand strip at the top of each card. */
const PLAN_BANNERS: Partial<Record<PlanId, string>> = {
  jio: "/jio.png",
  airtel: "/airtel.png",
  tata: "/tata.png",
  tesla: "/tesala.png",
}

export default function PlansPage() {
  const { ready: loaded, state } = useStore()
  const [buying, setBuying] = useState<PlanId | null>(null)
  if (!loaded) return <Skeleton />

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-headline-lg text-on-surface">Plans</h1>
          <Chip tone="mint" dot>
            {active(state).length} active
          </Chip>
        </div>
        <p className="mt-1 text-body-md text-on-variant">Invest once, earn daily for 30 days. Higher the plan, higher the daily income.</p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-card">
        <span className="text-label-md text-on-variant">Your balance</span>
        <span className="flex items-center gap-1.5 text-headline-sm text-on-surface">
          <CoinIcon className="size-5 text-claim" aria-hidden />
          ₹{fmt(state.coins)}
        </span>
      </div>

      <div className="flex gap-3 rounded-xl bg-primary-fixed/50 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <InfoIcon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-label-lg text-on-surface">How plans work</p>
          <p className="mt-0.5 text-body-sm text-on-variant">
            Subscribe to a plan and earn daily returns for 30 days. Claim your earnings every 24 hours. One plan of each type can run at a time.
          </p>
        </div>
      </div>

      {PLANS.map((p) => (
        <PlanCard key={p.id} planId={p.id} onBuy={() => setBuying(p.id)} />
      ))}

      <BuySheet planId={buying} onClose={() => setBuying(null)} />
    </div>
  )
}

function PlanCard({ planId, onBuy }: { planId: PlanId; onBuy: () => void }) {
  const { state } = useStore()
  const plan = getPlan(planId)
  const why = cantBuy(state, planId)
  const mine = active(state).find((o) => o.planId === planId)

  const banner = PLAN_BANNERS[planId]

  return (
    <article className={cn(card, "overflow-hidden")}>
      {/* Minimal brand strip — just the logo area, 96px tall */}
      {banner && (
        <div className="relative h-24 w-full overflow-hidden">
          <Image
            src={banner}
            alt={`${plan.name} brand`}
            fill
            className="object-cover object-top"
            priority
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {mine ? (
              <Chip tone="mint" dot className="mb-2">
                Running · day {mine.claimed} of {plan.days}
              </Chip>
            ) : (
              <Chip tone={planId === "tesla" ? "amber" : "indigo"} className="mb-2">
                {plan.tag}
              </Chip>
            )}
            <h2 className="text-headline-md text-on-surface">{plan.name} Plan</h2>
            <p className="text-body-md text-on-variant">{plan.blurb}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-stat text-on-surface">₹{fmt(plan.cost)}</p>
            <p className="text-label-sm text-on-variant">investment</p>
          </div>
        </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-low p-2">
        {[
          ["Daily earning", <><span className="text-claim">₹{plan.perDay}</span><span className="text-body-md font-normal text-on-variant"> / day</span></>, "text-claim"],
          ["Duration", `${plan.days} days`, ""],
          ["Total return", `₹${(plan.perDay * plan.days).toLocaleString("en-IN")}`, ""],
          ["Net profit", <span key="profit" className="text-claim">₹{((plan.perDay * plan.days) - plan.cost).toLocaleString("en-IN")}</span>, "text-claim"],
        ].map(([label, value, tone], i) => (
          <div key={i} className="rounded-lg bg-white p-3">
            <dt className="text-label-md text-on-variant">{label}</dt>
            <dd className={cn("mt-0.5 text-headline-sm text-on-surface", tone)}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        {why === null ? (
          <Button variant="buy" size="xl" className="w-full" onClick={onBuy}>
            Buy for ₹{fmt(plan.cost)} <ArrowRightIcon aria-hidden />
          </Button>
        ) : (
          <p className="flex h-[52px] items-center justify-center rounded-xl bg-surface-mid text-label-lg text-on-variant">
            {why === "running" ? "Already running" : `Need ₹${fmt(plan.cost - state.coins)} more`}
          </p>
        )}
      </div>
      </div>
    </article>
  )
}
