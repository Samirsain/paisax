import { CrownIcon, GemIcon, RocketIcon, SproutIcon } from "lucide-react"
import Image from "next/image"
import type { PlanId } from "@/lib/game"
import { cn } from "@/lib/utils"

/** A player's picture, cropped to a circle. Served as-is: remote SVG avatars can't go through the image optimizer. */
export const Avatar = ({ src, className }: { src: string; className?: string }) => (
  <Image src={src} alt="" width={128} height={128} unoptimized className={cn("size-8 shrink-0 rounded-full object-cover object-top", className)} />
)

/** The game's coin, drawn from public/dollar.png. Sized like the icons it sits beside. */
export const CoinIcon = ({ className }: { className?: string }) => (
  <Image src="/dollar.png" alt="" width={64} height={64} aria-hidden className={cn("size-4 shrink-0", className)} />
)

/** The Stitch logo redrawn: indigo tile, open ring, green dot, and a coin where the currency sign was. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={cn("size-8 shrink-0", className)} aria-hidden>
      <rect width="96" height="96" rx="24" fill="#6366f1" />
      <path d="M26.5 47.5a21 21 0 1 1 21 21" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="47.5" cy="47.5" r="10.5" fill="#10b981" />
      <circle cx="47.5" cy="47.5" r="5.5" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="67.5" cy="31" r="8" fill="#10b981" stroke="#6366f1" strokeWidth="3.5" />
    </svg>
  )
}

const TILES: Record<PlanId, { icon: typeof RocketIcon; tile: string }> = {
  jio: { icon: RocketIcon, tile: "bg-primary-fixed text-primary" },
  airtel: { icon: SproutIcon, tile: "bg-rose-soft text-rose" },
  tata: { icon: GemIcon, tile: "bg-amber-soft text-amber" },
  tesla: { icon: CrownIcon, tile: "bg-mint/35 text-claim" },
}

export function PlanIcon({ planId, className }: { planId: PlanId; className?: string }) {
  const { icon: Icon, tile } = TILES[planId]
  return (
    <span aria-hidden className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-xl", tile, className)}>
      <Icon className="size-[45%]" strokeWidth={2} />
    </span>
  )
}

const TONES = {
  mint: "bg-mint/30 text-on-mint",
  indigo: "bg-primary-fixed text-primary",
  amber: "bg-amber-soft text-amber",
  neutral: "bg-surface-high text-on-variant",
}

export function Chip({ tone = "neutral", dot = false, className, children }: { tone?: keyof typeof TONES; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

/** Progress as Stitch draws it: a rounded track with an indigo-to-emerald fill. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("block h-2 overflow-hidden rounded-full bg-surface-mid", className)} aria-hidden>
      <span
        className="block h-full rounded-full bg-gradient-to-r from-primary to-claim transition-[width] duration-700 ease-out"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </span>
  )
}

/** Placeholder while the saved game loads from this device. */
export const Skeleton = () => (
  <div className="flex flex-col gap-6 pt-2" aria-busy="true">
    <div className="h-12 w-2/3 animate-pulse rounded-xl bg-surface-mid" />
    <div className="h-72 animate-pulse rounded-xl bg-surface-mid" />
    <div className="h-32 animate-pulse rounded-xl bg-surface-mid" />
  </div>
)
