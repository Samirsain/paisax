"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, DownloadIcon, FlameIcon, LogOutIcon, SmartphoneIcon } from "lucide-react"
import { toast } from "sonner"
import { Avatar, Chip, Progress, Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LEVELS, completed, levelOf, liveStreak } from "@/lib/game"
import { useInstall } from "@/lib/install"
import { fmt, useStore } from "@/lib/store"
import { avatarOf, useAuth } from "@/lib/auth"
import { card, cn } from "@/lib/utils"

export default function ProfilePage() {
  const { ready: loaded, now, state } = useStore()
  const { user, logout } = useAuth()
  const router = useRouter()
  if (!loaded) return <Skeleton />

  const { level, floor, next } = levelOf(state.lifetime)
  const streak = liveStreak(state, now)

  return (
    <div className="flex flex-col gap-5 pt-2">
      <section className="flex items-center gap-4">
        {user ? (
          <Avatar src={avatarOf(user)} className="size-16" />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-[28px] font-bold text-white">
            {state.name.charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-headline-md text-on-surface">{state.name}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <Chip tone="indigo">Level {level}</Chip>
            <Chip tone="amber">
              <FlameIcon className="size-3.5" aria-hidden /> {streak ? `${streak} day streak` : "No streak yet"}
            </Chip>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["Best streak", `${state.bestStreak}d`],
          ["Plans done", completed(state).length],
          ["Invites", state.invites],
        ].map(([label, value]) => (
          <div key={label} className={cn(card, "p-3")}>
            <p className="text-label-md text-on-variant">{label}</p>
            <p className="mt-1 text-stat text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="level" className={cn(card, "p-5")}>
        <div className="flex items-baseline justify-between">
          <h2 id="level" className="text-headline-sm text-on-surface">
            Level {level}
          </h2>
          <span className="text-label-md text-on-variant">{next === null ? "Top level" : `${fmt(next - state.lifetime)} coins to level ${level + 1}`}</span>
        </div>
        <Progress value={next === null ? 1 : (state.lifetime - floor) / (next - floor)} className="mt-3" />
        <p className="mt-2 text-body-sm text-on-variant">Levels follow lifetime coins collected ({fmt(state.lifetime)}). Spending never lowers them.</p>
        <ol className="mt-4 grid grid-cols-5 gap-2" aria-label="Coins needed for each level">
          {LEVELS.map((min, i) => {
            const reached = i + 1 <= level
            const current = i + 1 === level
            return (
              <li
                key={min}
                className={cn(
                  "flex flex-col items-center rounded-lg py-2",
                  current ? "bg-primary-fixed text-primary ring-2 ring-primary" : reached ? "bg-mint/30 text-on-mint" : "bg-surface-low text-on-variant",
                )}
              >
                <span className="flex items-center gap-0.5 text-label-md">
                  {reached && !current && <CheckIcon className="size-3" strokeWidth={3} aria-label="reached" />}L{i + 1}
                </span>
                <span className="text-body-sm">{fmt(min)}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <NameCard key={state.name} />
      <InstallCard />

      {/* Logout */}
      <button
        type="button"
        onClick={async () => {
          await logout()
          router.replace("/login")
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3.5 text-label-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-100 active:scale-[0.99]"
      >
        <LogOutIcon className="size-5" aria-hidden />
        Log Out
      </button>
    </div>
  )
}

function NameCard() {
  const { state, rename } = useStore()
  const [name, setName] = useState(state.name)
  const clean = name.trim()
  return (
    <form
      className={cn(card, "flex flex-col gap-3 p-5")}
      onSubmit={(e) => {
        e.preventDefault()
        if (!clean) return
        rename(clean)
        toast.success("Name saved")
      }}
    >
      <label htmlFor="name" className="text-headline-sm text-on-surface">
        Your name
      </label>
      <div className="flex gap-2">
        <Input
          id="name"
          value={name}
          maxLength={24}
          autoComplete="given-name"
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!clean || undefined}
          className="h-11 rounded-xl bg-white px-3 text-body-lg md:text-body-lg"
        />
        <Button type="submit" variant="buy" size="lg" disabled={!clean || clean === state.name}>
          Save
        </Button>
      </div>
      {!clean && <p className="text-body-sm text-destructive">Enter a name so the app can greet you.</p>}
    </form>
  )
}

function InstallCard() {
  const { status, install } = useInstall()
  const help = {
    installed: "PaisaX is installed on this device.",
    prompt: "Add PaisaX to your home screen. It opens full screen and works offline.",
    ios: "In Safari, tap the Share button, then “Add to Home Screen”.",
    manual: "Open your browser menu and choose “Install app” or “Add to Home Screen”.",
  }[status]
  return (
    <section aria-labelledby="install" className={cn(card, "flex flex-col gap-4 p-5")}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <SmartphoneIcon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="install" className="text-headline-sm text-on-surface">
            Install the app
          </h2>
          <p className="mt-0.5 text-body-md text-on-variant">{help}</p>
        </div>
      </div>
      {status === "prompt" && (
        <Button variant="buy" size="lg" onClick={install}>
          <DownloadIcon aria-hidden /> Install PaisaX
        </Button>
      )}
    </section>
  )
}
