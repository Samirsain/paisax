"use client"

import { useState, useEffect } from "react"
import { XIcon, SendIcon, GiftIcon, ZapIcon } from "lucide-react"

interface WelcomeModalProps {
  forceOpen?: boolean
  onClose?: () => void
}

const TELEGRAM_CHANNEL_URL = "https://t.me/+GY7viuc1bm9lMjll"

/**
 * Compact, small-sized Telegram channel join modal.
 */
export function WelcomeModal({ forceOpen, onClose }: WelcomeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = forceOpen !== undefined ? forceOpen : internalOpen

  useEffect(() => {
    // Auto-open if user just signed up or on first visit of session
    const justRegistered = sessionStorage.getItem("solar_just_registered")
    const shownThisSession = sessionStorage.getItem("solar_welcome_shown")

    if (justRegistered || !shownThisSession) {
      setInternalOpen(true)
      sessionStorage.setItem("solar_welcome_shown", "true")
      if (justRegistered) {
        sessionStorage.removeItem("solar_just_registered")
      }
    }
  }, [])

  function handleClose() {
    setInternalOpen(false)
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[300px] sm:max-w-[315px] overflow-hidden rounded-[24px] bg-[#0c121e] border border-sky-500/35 p-4 sm:p-4.5 text-center shadow-[0_16px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(14,165,233,0.25)] animate-in zoom-in-95 duration-200 text-white">
        
        {/* Subtle ambient cyan glow */}
        <div className="absolute -top-10 -right-10 size-28 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <XIcon className="size-3.5" />
        </button>

        {/* Compact Telegram Icon with Live Pulse Indicator */}
        <div className="relative mx-auto mt-0.5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/25 via-blue-600/20 to-transparent border border-sky-400/40 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <SendIcon className="size-5 text-sky-400 -rotate-12 translate-x-0.5" />
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500 border border-[#0c121e]" />
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="mt-2 text-base font-black text-white tracking-tight">
          Join Official Telegram
        </h3>
        <p className="mt-1 text-[11px] text-slate-300 leading-snug px-1">
          Join our channel for daily gift codes, payment proofs & live updates!
        </p>

        {/* 2 Compact Feature Chips */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-left">
          <div className="rounded-xl bg-white/[0.04] border border-white/5 p-2">
            <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <GiftIcon className="size-3 text-amber-400" />
              <span>Gift Codes</span>
            </p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">₹50 - ₹500 free cash</p>
          </div>

          <div className="rounded-xl bg-white/[0.04] border border-white/5 p-2">
            <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <ZapIcon className="size-3 text-emerald-400" />
              <span>Proofs</span>
            </p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">Live withdrawals</p>
          </div>
        </div>

        {/* Primary CTA Button */}
        <a
          href={TELEGRAM_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClose}
          className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 py-2.5 text-xs font-extrabold text-white shadow-md shadow-sky-500/30 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <SendIcon className="size-3.5 -rotate-12" />
          <span>Join Telegram Channel</span>
        </a>

        {/* Secondary Dismiss */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-1.5 w-full text-center text-[10px] font-medium text-slate-400 hover:text-slate-300 transition-colors py-0.5 cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
