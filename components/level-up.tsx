"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CoinBurst } from "@/components/coin-lottie"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { levelOf } from "@/lib/game"
import { fmt, useLevelUp } from "@/lib/store"

// Ten sparks thrown out once around the trophy.
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
  const reach = i % 2 ? 62 : 84
  return {
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach)}px`,
    color: ["#6cf8bb", "#ffddb8", "#ffffff", "#e1e0ff"][i % 4],
    delay: `${250 + (i % 3) * 40}ms`,
  }
})

/** The level-up moment, shown over any screen whenever earning coins crosses a level. */
export function LevelUp() {
  const { levelUp, dismiss } = useLevelUp()
  const [open, setOpen] = useState(false)
  const [shownLevel, setShownLevel] = useState(0)

  useEffect(() => {
    if (!levelUp) return
    // Let the claim's own count animation land first, then celebrate.
    const show = setTimeout(() => {
      setShownLevel(levelUp.from)
      setOpen(true)
      navigator.vibrate?.([20, 40, 30])
    }, 700)
    const flip = setTimeout(() => setShownLevel(levelUp.to), 1250)
    return () => {
      clearTimeout(show)
      clearTimeout(flip)
    }
  }, [levelUp])

  if (!levelUp) return null
  const { to, lifetime } = levelUp
  const { next } = levelOf(lifetime)

  function close() {
    setOpen(false)
    dismiss()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-3xl bg-surface-low p-0 text-center sm:max-w-[22rem]">
        <div className="relative bg-gradient-to-br from-primary-container to-primary px-6 pt-6 pb-16">
          <div className="relative mx-auto flex size-32 items-center justify-center">
            <span className="glow-in absolute -inset-3 rounded-full bg-mint/45 blur-2xl" aria-hidden />
            {SPARKS.map((s, i) => (
              <span
                key={i}
                aria-hidden
                className="burst absolute top-1/2 left-1/2 size-2.5 rounded-full"
                style={{ background: s.color, animationDelay: s.delay, "--dx": s.dx, "--dy": s.dy } as React.CSSProperties}
              />
            ))}
            <CoinBurst size={128} loop />
          </div>
        </div>

        <div className="relative mx-4 -mt-10 rounded-2xl bg-white px-5 pt-5 pb-4 shadow-card">
          <DialogTitle className="rise text-headline-lg text-on-surface">
            Level{" "}
            <span className="inline-flex overflow-hidden align-bottom">
              <span key={shownLevel} className="level-flip inline-block text-primary">
                {shownLevel || to}
              </span>
            </span>{" "}
            reached!
          </DialogTitle>
          <DialogDescription className="rise mt-1.5 text-body-md text-on-variant" style={{ animationDelay: "120ms" }}>
            Your level grows with lifetime coins. Spending never lowers it.
          </DialogDescription>

          {/* The bar finishes the level just completed; the caption looks ahead to the next one. */}
          <div className="rise mt-5 text-left" style={{ animationDelay: "220ms" }}>
            <div className="flex justify-between text-label-md">
              <span className="text-on-variant">Level {to - 1}</span>
              <span className="text-primary">Level {to}</span>
            </div>
            <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-surface-mid">
              <span className="fill-bar block h-full w-full rounded-full bg-gradient-to-r from-primary to-claim" />
            </span>
            <p className="mt-2 text-body-sm text-on-variant">
              {fmt(lifetime)} lifetime coins{next !== null ? ` · ${fmt(next - lifetime)} more to level ${to + 1}` : " · top level"}
            </p>
          </div>
        </div>

        <div className="p-4">
          <Button variant="buy" size="xl" className="w-full" onClick={close}>
            Keep playing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
