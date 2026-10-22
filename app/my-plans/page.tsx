"use client"

import Link from "next/link"
import { useState } from "react"
import { AlarmClockIcon, AwardIcon, BadgeCheckIcon, CheckCheckIcon, CircleCheckIcon, HistoryIcon, PlusIcon, TrendingUpIcon } from "lucide-react"
import { toast } from "sonner"
import { BuySheet } from "@/components/buy-sheet"
import { Chip, CoinIcon, PlanIcon, Progress, Skeleton } from "@/components/marks"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { active, cantBuy, checkinCoins, checkinDay, completed, getPlan, nextClaimAt, ready, type Owned, type PlanId } from "@/lib/game"
import { clockTime, dayLabel, fmt, useStore, when } from "@/lib/store"
import { card, cn } from "@/lib/utils"

const tab = "h-full gap-2 rounded-lg text-label-lg text-on-variant data-active:bg-white data-active:text-primary data-active:shadow-sm"

export default function MyPlansPage() {
  const { ready: loaded, state } = useStore()
  const [buying, setBuying] = useState<PlanId | null>(null)
  if (!loaded) return <Skeleton />

  const running = active(state)
  const finished = completed(state)
  const perDay = running.reduce((n, o) => n + getPlan(o.planId).perDay, 0)
  const collected = state.owned.reduce((n, o) => n + o.claimed * getPlan(o.planId).perDay, 0)

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-headline-lg text-on-surface">My Plans</h1>
        <Chip tone="mint" dot>
          {running.length} running
        </Chip>
      </div>

      <Tabs defaultValue="active" className="gap-5">
        <TabsList className="h-14 w-full rounded-xl bg-surface-mid p-1.5">
          <TabsTrigger value="active" className={tab}>
            <BadgeCheckIcon className="size-5" aria-hidden /> Active ({running.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className={tab}>
            <HistoryIcon className="size-5" aria-hidden /> Completed ({finished.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-primary-container to-primary p-5 text-white shadow-lg shadow-primary/20">
          <div>
            <p className="flex items-center gap-1.5 text-label-md opacity-85">
              <TrendingUpIcon className="size-4" aria-hidden /> Daily coins
            </p>
            <p className="mt-1 text-[32px] leading-none font-bold tracking-tight">
              {fmt(perDay)}
              <span className="text-body-lg font-normal opacity-80"> / day</span>
            </p>
          </div>
          <div className="h-12 w-px bg-white/25" aria-hidden />
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-label-md opacity-85">
              <CoinIcon className="size-4" aria-hidden /> Collected
            </p>
            <p className="mt-1 text-[32px] leading-none font-bold tracking-tight text-mint">{fmt(collected)}</p>
          </div>
        </div>

        <TabsContent value="active" className="flex flex-col gap-4">
          {running.length === 0 && <p className={cn(card, "p-5 text-body-lg text-on-variant")}>No plans running. Subscribe to a plan and start earning daily returns.</p>}
          {running.map((o) => (
            <ActiveCard key={o.id} owned={o} />
          ))}
          <div className="flex flex-col gap-4 rounded-xl bg-surface-low p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber">
                <AwardIcon className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-headline-sm text-on-surface">Add another plan</p>
                <p className="text-body-md text-on-variant">Each plan you run adds its coins to every day&rsquo;s claim.</p>
              </div>
            </div>
            <Link href="/plans" className={cn(buttonVariants({ variant: "buy", size: "lg" }), "w-full")}>
              <PlusIcon aria-hidden /> Explore plans
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="flex flex-col gap-4">
          {finished.length === 0 && (
            <p className={cn(card, "p-5 text-body-lg text-on-variant")}>Nothing completed yet. A plan completes after 30 days of daily claims, then you can resubscribe.</p>
          )}
          {finished.map((o) => (
            <DoneCard key={o.id} owned={o} onBuyAgain={() => setBuying(o.planId)} />
          ))}
        </TabsContent>
      </Tabs>

      <BuySheet planId={buying} onClose={() => setBuying(null)} />
    </div>
  )
}

function Head({ owned: o, chip }: { owned: Owned; chip: React.ReactNode }) {
  const plan = getPlan(o.planId)
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-headline-md text-on-surface">{plan.name} Plan</h2>
          {chip}
        </div>
        <p className="mt-0.5 text-body-md text-on-variant">
          Cost ₹{fmt(plan.cost)} · <span className="font-semibold text-claim">₹{plan.perDay} / day</span>
        </p>
      </div>
      <PlanIcon planId={o.planId} />
    </div>
  )
}

function Totals({ left, right }: { left: [string, number]; right: [string, number] }) {
  return (
    <div className="flex justify-between rounded-xl bg-surface-low p-4">
      <div>
        <p className="text-label-md text-on-variant">{left[0]}</p>
        <p className="text-stat text-on-surface">{fmt(left[1])}</p>
      </div>
      <div className="text-right">
        <p className="text-label-md text-on-variant">{right[0]}</p>
        <p className="text-stat text-on-surface">{fmt(right[1])}</p>
      </div>
    </div>
  )
}

function ActiveCard({ owned: o }: { owned: Owned }) {
  const { now, state, collect } = useStore()
  const plan = getPlan(o.planId)
  const isDue = ready(state, now).some((x) => x.id === o.id)
  const day = checkinDay(state, now)
  const at = nextClaimAt(o)

  function claim() {
    const coins = collect(o.id)
    toast.success(`+${fmt(coins)} coins`, { description: day ? `Includes today's check-in bonus of ${checkinCoins(day)}.` : `${plan.name} Plan, day ${o.claimed + 1}` })
  }

  return (
    <article className={cn(card, "flex flex-col gap-4 p-5")}>
      <Head
        owned={o}
        chip={
          <Chip tone="mint" dot>
            Active
          </Chip>
        }
      />
      <div>
        <div className="flex justify-between text-label-lg">
          <span className="text-on-surface">
            Day {o.claimed} of {plan.days} completed
          </span>
          <span className="text-amber">{plan.days - o.claimed} days left</span>
        </div>
        <Progress value={o.claimed / plan.days} className="mt-2" />
      </div>
      <Totals left={["Claimed so far", o.claimed * plan.perDay]} right={["Left to claim", (plan.days - o.claimed) * plan.perDay]} />

      {isDue ? (
        <>
          <p className="flex items-center gap-2 text-label-lg text-on-surface">
            <AlarmClockIcon className="size-5 text-amber" aria-hidden /> Claim ready for today
          </p>
          <Button variant="claim" size="xl" onClick={claim}>
            <CoinIcon aria-hidden /> Claim {plan.perDay}
            {day ? ` + ${checkinCoins(day)} check-in` : " coins"}
          </Button>
        </>
      ) : (
        <>
          {o.lastClaimAt !== null && (
            <p className="flex items-center gap-2 text-label-lg text-on-surface">
              <CircleCheckIcon className="size-5 text-claim" aria-hidden /> Claimed {dayLabel(o.lastClaimAt, now).toLowerCase()} at {clockTime(o.lastClaimAt)}
            </p>
          )}
          <div className="flex items-center gap-3">
            <p className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-mid text-label-lg text-on-variant">
              <CheckCheckIcon className="size-5" aria-hidden /> Claimed
            </p>
            {at && <p className="text-right text-label-md text-on-surface">Next {when(at, now)}</p>}
          </div>
        </>
      )}
    </article>
  )
}

function DoneCard({ owned: o, onBuyAgain }: { owned: Owned; onBuyAgain: () => void }) {
  const { now, state } = useStore()
  const plan = getPlan(o.planId)
  const again = cantBuy(state, o.planId)
  return (
    <article className={cn(card, "flex flex-col gap-4 p-5")}>
      <Head owned={o} chip={<Chip tone="neutral">Completed</Chip>} />
      <Progress value={1} />
      <Totals left={["Collected", o.claimed * plan.perDay]} right={["Days claimed", o.claimed]} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-md text-on-variant">Finished {o.lastClaimAt ? dayLabel(o.lastClaimAt, now).toLowerCase() : ""}</p>
        {again === null ? (
          <Button variant="buy" size="lg" onClick={onBuyAgain}>
            Buy again
          </Button>
        ) : (
          <span className="text-label-md text-on-variant">{again === "running" ? "Running again" : `Need ₹${fmt(plan.cost - state.coins)} more`}</span>
        )}
      </div>
    </article>
  )
}
