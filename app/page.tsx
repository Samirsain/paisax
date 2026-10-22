"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CheckCheckIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClockIcon,
  FlameIcon,
  PiggyBankIcon,
  PieChartIcon,
  Share2Icon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react"
import { CoinBurst } from "@/components/coin-lottie"
import { Chip, CoinIcon, PlanIcon, Progress, Skeleton } from "@/components/marks"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  INVITE_BONUS,
  STREAK_CAP,
  active,
  checkinCoins,
  checkinDay,
  getPlan,
  levelOf,
  liveStreak,
  nextReadyAt,
  ready,
  readyCoins,
} from "@/lib/game"
import { fmt, useStore, when } from "@/lib/store"
import { useTween } from "@/lib/use-tween"
import { card, cn } from "@/lib/utils"

function greeting(now: number) {
  const h = new Date(now).getHours()
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
}

export default function HomePage() {
  const { ready: loaded, now, state } = useStore()
  if (!loaded) return <Skeleton />

  const streak = liveStreak(state, now)
  const running = active(state).length
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <h1 className="text-headline-md text-on-surface">
            {greeting(now)}, {state.name}
          </h1>
          <p className="text-body-sm text-on-variant">
            You have {running} active {running === 1 ? "plan" : "plans"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-mid px-3 py-1.5 text-label-md text-on-surface">
          <FlameIcon className="size-[18px] text-[#a36700]" aria-hidden />
          {streak ? `${streak} day streak` : "Start a streak"}
        </span>
      </div>
      <ClaimCard />
      <Stats />
      <CheckinWeek />
      <ActivePlans />
      <InviteCard />
    </div>
  )
}

function ClaimCard() {
  const { now, state, collect } = useStore()
  const [said, setSaid] = useState("")
  const [burst, setBurst] = useState(false)
  const coins = readyCoins(state, now)
  const shown = useTween(coins)
  const day = checkinDay(state, now)
  const due = ready(state, now)
  const nextAt = nextReadyAt(state)

  const parts = [...(day ? [`Check-in ${checkinCoins(day)}`] : []), ...due.map((o) => `${getPlan(o.planId).name} ${getPlan(o.planId).perDay}`)]

  function claim() {
    setSaid(`Claimed ${fmt(collect())} coins.`)
    setBurst(true)
    setTimeout(() => setBurst(false), 2500)
  }

  return (
    <section aria-labelledby="claim" className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-6 shadow-hero">
      <div className="pointer-events-none absolute -top-8 -right-8 size-36 rounded-full bg-mint/20 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-6 -left-6 size-32 rounded-full bg-primary-fixed/40 blur-2xl" aria-hidden />

      <div className="relative flex items-center justify-between gap-2">
        {coins > 0 ? (
          <Chip tone="mint" dot className="text-label-sm uppercase">
            Daily claim ready
          </Chip>
        ) : (
          <Chip tone="neutral" className="text-label-sm uppercase">
            <CheckIcon className="size-3.5" aria-hidden /> All claimed
          </Chip>
        )}
        <span className="text-label-sm text-on-variant">Check-in day {Math.max(day ?? liveStreak(state, now), 1)}</span>
      </div>

      <div className="relative">
        {burst && (
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2" aria-hidden>
            <CoinBurst size={180} />
          </div>
        )}
        <h2 id="claim" className="flex items-center gap-2">
          <CoinIcon className="size-8 text-claim" aria-hidden />
          <span className="text-display text-on-surface">{fmt(shown)}</span>
          <span className="sr-only">coins ready</span>
        </h2>
        <p className="text-label-md text-on-variant">Coins ready to claim today</p>
      </div>

      {coins > 0 ? (
        <>
          <p className="relative flex items-start gap-2 rounded-lg bg-surface-low px-3 py-2 text-body-sm text-on-variant">
            <PieChartIcon className="mt-px size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-balance">{parts.join(" · ")}</span>
          </p>
          <Button variant="claim" size="xl" className="relative w-full" onClick={claim}>
            <ZapIcon className="fill-current" aria-hidden /> Claim {fmt(coins)} coins
          </Button>
        </>
      ) : (
        <div className="relative">
          <p className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-mid text-label-lg text-on-variant">
            <CheckCheckIcon className="size-5" aria-hidden /> Claimed for today
          </p>
          <p className="mt-2 text-center text-body-sm text-on-variant">
            {nextAt ? `Plans pay again ${when(nextAt, now)}` : "Your check-in reopens tomorrow"}
          </p>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </section>
  )
}

function Stats() {
  const { state } = useStore()
  const { level, next } = levelOf(state.lifetime)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={cn(card, "flex flex-col justify-between p-4")}>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-mid text-primary">
            <PiggyBankIcon className="size-[18px]" aria-hidden />
          </span>
          <Chip tone="indigo" className="px-2 py-0.5 text-label-sm">
            Level {level}
          </Chip>
        </div>
        <p className="text-label-sm text-on-variant">Coin balance</p>
        <p className="text-stat text-on-surface">{fmt(state.coins)}</p>
      </div>
      <div className={cn(card, "flex flex-col justify-between p-4")}>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-mid text-primary">
            <TrophyIcon className="size-[18px]" aria-hidden />
          </span>
          {next !== null && (
            <Chip tone="neutral" className="px-2 py-0.5 text-label-sm">
              {fmt(next - state.lifetime)} to L{level + 1}
            </Chip>
          )}
        </div>
        <p className="text-label-sm text-on-variant">Lifetime coins</p>
        <p className="text-stat text-on-surface">{fmt(state.lifetime)}</p>
      </div>
    </div>
  )
}

function CheckinWeek() {
  const { now, state } = useStore()
  const day = checkinDay(state, now)
  const streak = liveStreak(state, now)
  const painted = day ? Math.min(streak, STREAK_CAP - 1) : Math.min(streak, STREAK_CAP)
  const today = day ? painted : painted - 1

  return (
    <section aria-labelledby="checkin" className={cn(card, "p-4")}>
      <h2 id="checkin" className="text-headline-sm text-on-surface">
        Daily check-in
      </h2>
      <p className="mt-0.5 text-body-md text-on-variant">Claim every day and the bonus grows, up to {checkinCoins(STREAK_CAP)} coins on day 7.</p>
      <ol className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: STREAK_CAP }, (_, i) => {
          const done = i < painted
          const isToday = i === today
          return (
            <li key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-label-md",
                  done ? "bg-mint/30 text-on-mint" : isToday ? "bg-primary-fixed text-primary ring-2 ring-primary" : "bg-surface-low text-on-variant",
                )}
              >
                {done ? <CheckIcon className="size-4" strokeWidth={3} aria-label="claimed" /> : <CoinIcon className="size-4" aria-hidden />}+{checkinCoins(i + 1)}
              </span>
              <span className={cn("text-label-sm", isToday ? "text-primary" : "text-on-variant")}>{isToday ? "Today" : `Day ${i + 1}`}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ActivePlans() {
  const { now, state } = useStore()
  const running = active(state)
  const due = new Set(ready(state, now).map((o) => o.id))

  return (
    <section aria-labelledby="active" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="active" className="flex items-center gap-2 text-headline-md text-on-surface">
          Active Plans
          <span className="rounded-full bg-primary-fixed px-2 text-label-md text-primary">{running.length}</span>
        </h2>
        <Link href="/my-plans" className="flex items-center text-label-lg text-primary">
          View all <ChevronRightIcon className="size-5" aria-hidden />
        </Link>
      </div>

      {running.length === 0 && (
        <div className={cn(card, "p-5")}>
          <p className="text-body-lg text-on-surface">No plans yet</p>
          <p className="mt-1 text-body-md text-on-variant">Subscribe to a plan and earn daily returns for 30 days.</p>
          <Link href="/plans" className={cn(buttonVariants({ variant: "buy", size: "lg" }), "mt-4 w-full")}>
            Explore plans
          </Link>
        </div>
      )}

      {running.map((o) => {
        const plan = getPlan(o.planId)
        return (
          <Link key={o.id} href="/my-plans" className={cn(card, "block p-4 transition-shadow hover:shadow-md")}>
            <div className="flex items-start gap-3">
              <PlanIcon planId={o.planId} />
              <div className="min-w-0 flex-1">
                <p className="text-headline-sm text-on-surface">{plan.name} Plan</p>
                <p className="text-body-md text-on-variant">
                  ₹{fmt(plan.cost)} · ₹{plan.perDay}/day
                </p>
              </div>
              {due.has(o.id) ? (
                <Chip tone="amber">
                  <ClockIcon className="size-3.5" aria-hidden /> Ready
                </Chip>
              ) : (
                <Chip tone="mint">
                  <CircleCheckIcon className="size-3.5" aria-hidden /> Claimed
                </Chip>
              )}
            </div>
            <div className="mt-4 flex justify-between text-label-md">
              <span className="text-on-variant">Progress ({Math.round((o.claimed / plan.days) * 100)}%)</span>
              <span className="text-on-surface">
                Day {o.claimed} of {plan.days}
              </span>
            </div>
            <Progress value={o.claimed / plan.days} className="mt-2" />
          </Link>
        )
      })}
    </section>
  )
}

function InviteCard() {
  const { state } = useStore()
  return (
    <section aria-labelledby="invite" className="flex items-center gap-4 rounded-xl bg-surface-mid p-5">
      <div className="min-w-0 flex-1">
        <h2 id="invite" className="text-headline-sm text-on-surface">
          Invite friends & get {INVITE_BONUS} coins
        </h2>
        <p className="mt-1 text-body-md text-on-variant">Bonus coins land when a friend joins.</p>
        <p className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-label-md text-on-surface">
          Code:<span className="ml-1 text-primary">{state.inviteCode}</span>
        </p>
      </div>
      <Link href="/refer" className={buttonVariants({ variant: "buy", size: "lg" })}>
        <Share2Icon aria-hidden /> Share
      </Link>
    </section>
  )
}
