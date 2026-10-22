"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarCheckIcon, GiftIcon, ShoppingBagIcon, UserPlusIcon, WalletIcon, ZapIcon } from "lucide-react"
import { Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { getPlan, levelOf, type Entry } from "@/lib/game"
import { clockTime, dayLabel, fmt, useStore } from "@/lib/store"
import { card, cn } from "@/lib/utils"

const FILTERS = {
  All: () => true,
  Claims: (e: Entry) => e.kind === "claim" || e.kind === "checkin",
  Purchases: (e: Entry) => e.kind === "buy",
  Bonuses: (e: Entry) => e.kind === "invite" || e.kind === "welcome",
}
type Filter = keyof typeof FILTERS

const PAGE = 15

function describe(e: Entry) {
  switch (e.kind) {
    case "claim":
      return { title: `Daily claim · ${getPlan(e.planId).name} Plan`, icon: ZapIcon, tile: "bg-mint/35 text-claim" }
    case "checkin":
      return { title: `Check-in · day ${e.streakDay}`, icon: CalendarCheckIcon, tile: "bg-mint/35 text-claim" }
    case "buy":
      return { title: `Bought ${getPlan(e.planId).name} Plan`, icon: ShoppingBagIcon, tile: "bg-surface-mid text-on-variant" }
    case "invite":
      return { title: "Friend joined", icon: UserPlusIcon, tile: "bg-amber-soft text-amber" }
    case "welcome":
      return { title: "Welcome gift", icon: GiftIcon, tile: "bg-amber-soft text-amber" }
  }
}

export default function WalletPage() {
  const { ready: loaded, now, state } = useStore()
  const [filter, setFilter] = useState<Filter>("All")
  const [limit, setLimit] = useState(PAGE)
  if (!loaded) return <Skeleton />

  const sum = (f: (e: Entry) => boolean) => state.history.filter(f).reduce((n, e) => n + Math.abs(e.coins), 0)
  const rows = state.history.filter(FILTERS[filter])

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="sr-only">Wallet</h1>
      <section className="rounded-2xl bg-gradient-to-br from-primary-container to-primary p-6 text-white shadow-lg shadow-primary/25">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-label-lg opacity-90">
            <WalletIcon className="size-5" aria-hidden /> Coin balance
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-label-md">
            <span className="size-1.5 rounded-full bg-mint" aria-hidden /> Virtual coins
          </span>
        </div>
        <p className="mt-3 text-[44px] leading-none font-bold tracking-tight">{fmt(state.coins)}</p>
        <p className="mt-2 text-body-md opacity-85">
          Lifetime {fmt(state.lifetime)} · Level {levelOf(state.lifetime).level}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/plans" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-label-lg text-primary shadow-sm active:scale-[0.98]">
            <ShoppingBagIcon className="size-5" aria-hidden /> Buy a plan
          </Link>
          <Link href="/refer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/20 text-label-lg text-white active:scale-[0.98]">
            <UserPlusIcon className="size-5" aria-hidden /> Invite
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["Claimed", sum(FILTERS.Claims), "From claims", "text-claim"],
          ["Spent", sum(FILTERS.Purchases), "On plans", ""],
          ["Bonuses", sum(FILTERS.Bonuses), "Gifts, invites", "text-amber"],
        ].map(([label, value, note, tone]) => (
          <div key={label} className={cn(card, "p-3")}>
            <p className="text-label-md text-on-variant">{label}</p>
            <p className={cn("mt-2 text-headline-sm font-bold text-on-surface", tone)}>{fmt(value as number)}</p>
            <p className="text-body-sm text-on-variant">{note}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="history" className="text-headline-md text-on-surface">
            Coin history
          </h2>
          <span className="text-body-md text-on-variant">{state.history.length} entries</span>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filter history">
          {(Object.keys(FILTERS) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f)
                setLimit(PAGE)
              }}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-label-lg transition-colors",
                filter === f ? "bg-primary text-white" : "bg-surface-mid text-on-variant hover:bg-surface-high",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className={cn(card, "divide-y divide-border overflow-hidden")}>
          {rows.length === 0 && <li className="p-5 text-body-md text-on-variant">Nothing here yet.</li>}
          {rows.slice(0, limit).map((e) => {
            const { title, icon: Icon, tile } = describe(e)
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", tile)} aria-hidden>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg text-on-surface">{title}</p>
                  <p className="text-body-sm text-on-variant">
                    {dayLabel(e.at, now)}, {clockTime(e.at)}
                  </p>
                </div>
                <p className={cn("shrink-0 text-headline-sm", e.coins > 0 ? "text-claim" : "text-on-surface")}>
                  {e.coins > 0 ? "+" : "−"}
                  {fmt(Math.abs(e.coins))}
                </p>
              </li>
            )
          })}
        </ul>
        {rows.length > limit && (
          <Button variant="soft" size="lg" onClick={() => setLimit(limit + PAGE)}>
            Show more
          </Button>
        )}
      </section>


    </div>
  )
}
