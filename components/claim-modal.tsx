"use client"

import { useEffect, useState } from "react"
import { CoinBurst } from "@/components/coin-lottie"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ZapIcon, CheckCircle2Icon, SparklesIcon, WalletIcon } from "lucide-react"
import { fmt } from "@/lib/store"

// Sparkling celebratory particles around the coin
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const reach = i % 2 ? 70 : 95
  return {
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach)}px`,
    color: ["#f59e0b", "#fbbf24", "#10b981", "#ffffff", "#fef08a"][i % 5],
    delay: `${150 + (i % 4) * 50}ms`,
  }
})

interface ClaimRewardData {
  planName: string
  coins: number
  day?: number
  totalDays?: number
}

interface ClaimModalProps {
  reward: ClaimRewardData | null
  onClose: () => void
}

export function ClaimRewardModal({ reward, onClose }: ClaimModalProps) {
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (reward) {
      setBounce(true)
      // Haptic feedback on mobile if supported
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([30, 40, 50, 40, 60])
        }
      } catch {
        // ignore
      }
    } else {
      setBounce(false)
    }
  }, [reward])

  if (!reward) return null

  return (
    <Dialog open={!!reward} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[32px] bg-[#0c1322] border-2 border-amber-500/40 p-0 text-center shadow-2xl sm:max-w-[22rem] animate-in zoom-in-95 duration-200"
      >
        <DialogTitle className="sr-only">Daily Reward Claimed</DialogTitle>
        <DialogDescription className="sr-only">
          {reward.planName} daily return of ₹{fmt(reward.coins)} has been credited.
        </DialogDescription>

        {/* ── TOP HEADER GLOW & COIN BURST ────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-amber-600/30 via-amber-500/10 to-transparent px-6 pt-8 pb-4">
          
          {/* Ambient radial solar glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-transparent blur-3xl pointer-events-none" />

          {/* Golden Badge Pill */}
          <div className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300 shadow-sm shadow-amber-500/20 mb-3">
            <SparklesIcon className="size-3.5 text-yellow-300 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Daily Reward Unlocked</span>
          </div>

          {/* Central Lottie & Burst Container */}
          <div className="relative mx-auto flex size-36 items-center justify-center">
            {/* Flying Sparks */}
            {SPARKS.map((s, i) => (
              <span
                key={i}
                aria-hidden
                className="burst absolute top-1/2 left-1/2 size-2 rounded-full pointer-events-none shadow-xs"
                style={
                  {
                    background: s.color,
                    animationDelay: s.delay,
                    "--dx": s.dx,
                    "--dy": s.dy,
                  } as React.CSSProperties
                }
              />
            ))}

            {/* Lottie Coin Burst */}
            <div className="relative z-10 scale-110 drop-shadow-[0_10px_25px_rgba(245,158,11,0.5)]">
              <CoinBurst size={140} loop />
            </div>
          </div>

          {/* Big Gleaming Golden Amount */}
          <div className="relative mt-2">
            <span className="block text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]">
              +₹{fmt(reward.coins)}
            </span>
            <p className="mt-1 text-xs font-bold text-amber-200/90 tracking-wide uppercase">
              Added to Wallet Balance
            </p>
          </div>
        </div>

        {/* ── CARD BODY DETAILS ────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-3">
          
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 text-left shadow-inner">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Plan Income Collected
                </p>
                <p className="text-sm font-black text-white mt-0.5 line-clamp-1">
                  {reward.planName}
                </p>
              </div>
              <span className="shrink-0 flex items-center justify-center size-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ZapIcon className="size-4" />
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Daily Payout Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
                <CheckCircle2Icon className="size-3.5" />
                <span>Credited</span>
              </span>
            </div>
          </div>

          {/* Gaming Collect Button */}
          <button
            type="button"
            onClick={onClose}
            className="group relative w-full overflow-hidden rounded-2xl p-0.5 font-black text-slate-950 transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all group-hover:opacity-90" />
            <span className="relative flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-black tracking-wide text-slate-950">
              <SparklesIcon className="size-4 text-slate-950 animate-bounce" />
              <span>AWESOME! COLLECT REWARD</span>
            </span>
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
