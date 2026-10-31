"use client"

import { useEffect } from "react"
import { CoinBurst } from "@/components/coin-lottie"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ZapIcon, CheckCircle2Icon, SparklesIcon, WalletIcon } from "lucide-react"
import { fmt } from "@/lib/store"

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
  useEffect(() => {
    if (reward) {
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([20, 30, 40])
        }
      } catch {
        // ignore
      }
    }
  }, [reward])

  if (!reward) return null

  return (
    <Dialog open={!!reward} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[28px] bg-[#0c121e] border border-slate-800 p-0 text-center shadow-2xl sm:max-w-[22rem] animate-in zoom-in-95 duration-200"
      >
        <DialogTitle className="sr-only">Daily Reward Claimed</DialogTitle>
        <DialogDescription className="sr-only">
          {reward.planName} daily return of ₹{fmt(reward.coins)} has been credited.
        </DialogDescription>

        {/* ── TOP HEADER CELEBRATION ──────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-amber-500/15 to-transparent px-6 pt-7 pb-3">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-300 shadow-xs mb-3">
            <SparklesIcon className="size-3.5 text-amber-400" />
            <span>Daily Return Credited</span>
          </div>

          {/* Lottie Coin Burst */}
          <div className="relative mx-auto flex size-32 items-center justify-center">
            <div className="relative z-10 scale-105">
              <CoinBurst size={128} loop />
            </div>
          </div>

          {/* Solid High-Contrast Golden Numeral (Impeccable Typeset) */}
          <div className="relative mt-1">
            <span className="block text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-400">
              +₹{fmt(reward.coins)}
            </span>
            <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Transferred to Wallet
            </p>
          </div>
        </div>

        {/* ── DETAILS CONTAINER ────────────────────────────────────────── */}
        <div className="px-5 py-4 space-y-3">
          
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-left">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Plan Income
                </p>
                <p className="text-sm font-black text-white mt-0.5 line-clamp-1">
                  {reward.planName}
                </p>
              </div>
              <span className="shrink-0 flex size-7 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ZapIcon className="size-4" />
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {reward.day ? `Day ${reward.day}${reward.totalDays ? ` of ${reward.totalDays}` : ""}` : "Daily Return"}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <CheckCircle2Icon className="size-3.5" />
                <span>Credited to Wallet</span>
              </span>
            </div>
          </div>

          {/* Action Button: High contrast, purposeful, accessible */}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-yellow-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <SparklesIcon className="size-4 text-slate-950" />
            <span>Awesome! Continue Earning</span>
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
