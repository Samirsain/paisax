"use client"

import React from "react"
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react"

// ── OFFICIAL PHONEPE SVG BADGE ──────────────────────────────────────────────────
export function PhonePeLogo({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit={2}
      className={className}
    >
      <circle cx="256" cy="256" r="256" fill="#5F259F" />
      <path
        d="M372.164 189.203c0-10.008-8.576-18.593-18.584-18.593h-34.323l-78.638-90.084c-7.154-8.577-18.592-11.439-30.03-8.577l-27.17 8.577c-4.292 1.43-5.723 7.154-2.862 10.007l85.8 81.508H136.236c-4.293 0-7.154 2.861-7.154 7.154v14.292c0 10.016 8.585 18.592 18.592 18.592h20.015v68.639c0 51.476 27.17 81.499 72.931 81.499 14.292 0 25.739-1.431 40.03-7.146v45.753c0 12.87 10.016 22.886 22.885 22.886h20.015c4.293 0 8.577-4.293 8.577-8.586V210.648h32.893c4.292 0 7.145-2.861 7.145-7.145v-14.3zM280.65 312.17c-8.576 4.292-20.015 5.723-28.591 5.723-22.886 0-34.324-11.438-34.324-37.176v-68.639h62.915v100.092z"
        fill="#FFFFFF"
        fillRule="nonzero"
      />
    </svg>
  )
}

// ── OFFICIAL PAYTM SVG BADGE ────────────────────────────────────────────────────
export function PaytmLogo({ className = "h-4.5 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 122.88 38.52"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {/* 'tm' & accent dot in official cyan */}
        <path
          fill="#00BAF2"
          d="M122.47,11.36c-1.12-3.19-4.16-5.48-7.72-5.48h-0.08c-2.32,0-4.41,0.97-5.9,2.52 c-1.49-1.55-3.58-2.52-5.9-2.52h-0.07c-2.04,0-3.91,0.75-5.34,1.98V7.24c-0.05-0.63-0.56-1.12-1.2-1.12h-5.48 c-0.67,0-1.21,0.54-1.21,1.21v29.74c0,0.67,0.54,1.21,1.21,1.21h5.48c0.61,0,1.12-0.46,1.19-1.04l0-21.35c0-0.08,0-0.14,0.01-0.21 c0.09-0.95,0.79-1.74,1.89-1.83h1.01c0.46,0.04,0.85,0.2,1.15,0.45c0.48,0.38,0.74,0.96,0.74,1.6l0.02,21.24 c0,0.67,0.54,1.22,1.21,1.22h5.48c0.65,0,1.17-0.51,1.2-1.15l0-21.33c0-0.7,0.32-1.34,0.89-1.71c0.28-0.18,0.62-0.3,1.01-0.34h1.01 c1.19,0.1,1.9,1,1.9,2.05l0.02,21.22c0,0.67,0.54,1.21,1.21,1.21h5.48c0.64,0,1.17-0.5,1.21-1.13V13.91 C122.86,12.6,122.69,11.99,122.47,11.36L122.47,11.36z M85.39,6.2h-3.13V1.12c0-0.01,0-0.01,0-0.02C82.26,0.5,81.77,0,81.15,0 c-0.07,0-0.14,0.01-0.21,0.02c-3.47,0.95-2.78,5.76-9.12,6.17h-0.61c-0.09,0-0.18,0.01-0.27,0.03h-0.01l0.01,0 C70.41,6.35,70,6.83,70,7.41v5.48c0,0.67,0.54,1.21,1.21,1.21h3.3l-0.01,23.22c0,0.66,0.54,1.2,1.2,1.2h5.42 c0.66,0,1.2-0.54,1.2-1.2l0-23.22h3.07c0.66,0,1.21-0.55,1.21-1.21V7.41C86.6,6.74,86.06,6.2,85.39,6.2L85.39,6.2z"
        />
        {/* 'pay' in official deep navy */}
        <path
          fill="#20336B"
          d="M65.69,6.2h-5.48C59.55,6.2,59,6.74,59,7.41v11.33c-0.01,0.7-0.58,1.26-1.28,1.26h-2.29 c-0.71,0-1.29-0.57-1.29-1.28L54.12,7.41c0-0.67-0.54-1.21-1.21-1.21h-5.48c-0.67,0-1.21,0.54-1.21,1.21v12.41 c0,4.71,3.36,8.08,8.08,8.08c0,0,3.54,0,3.65,0.02c0.64,0.07,1.13,0.61,1.13,1.27c0,0.65-0.48,1.19-1.12,1.27 c-0.03,0-0.06,0.01-0.09,0.02l-8.01,0.03c-0.67,0-1.21,0.54-1.21,1.21v5.47c0,0.67,0.54,1.21,1.21,1.21h8.95 c4.72,0,8.08-3.36,8.08-8.07V7.41C66.9,6.74,66.36,6.2,65.69,6.2L65.69,6.2z M34.53,6.23h-7.6c-0.67,0-1.22,0.51-1.22,1.13v2.13 c0,0.01,0,0.03,0,0.04c0,0.02,0,0.03,0,0.05v2.92c0,0.66,0.58,1.21,1.29,1.21h7.24c0.57,0.09,1.02,0.51,1.09,1.16v0.71 c-0.06,0.62-0.51,1.07-1.06,1.12h-3.58c-4.77,0-8.16,3.17-8.16,7.61v6.37c0,4.42,2.92,7.56,7.65,7.56h9.93 c1.78,0,3.23-1.35,3.23-3.01V14.45C43.34,9.41,40.74,6.23,34.53,6.23L34.53,6.23z M35.4,29.09v0.86c0,0.07-0.01,0.14-0.02,0.2 c-0.01,0.06-0.03,0.12-0.05,0.18c-0.17,0.48-0.65,0.83-1.22,0.83h-2.28c-0.71,0-1.29-0.54-1.29-1.21v-1.03c0-0.01,0-0.03,0-0.04 l0-2.75v-0.86l0-0.01c0-0.66,0.58-1.2,1.29-1.2h2.28c0.71,0,1.29,0.54,1.29,1.21V29.09L35.4,29.09z M13.16,6.19H1.19 C0.53,6.19,0,6.73,0,7.38v5.37c0,0.01,0,0.02,0,0.03c0,0.03,0,0.05,0,0.07v24.29c0,0.66,0.49,1.2,1.11,1.21h5.58 c0.67,0,1.21-0.54,1.21-1.21l0.02-8.32h5.24c4.38,0,7.44-3.04,7.44-7.45v-7.72C20.6,9.25,17.54,6.19,13.16,6.19L13.16,6.19z M12.68,16.23v3.38c0,0.71-0.57,1.29-1.28,1.29l-3.47,0v-6.77h3.47c0.71,0,1.28,0.57,1.28,1.28V16.23L12.68,16.23z"
        />
      </g>
    </svg>
  )
}

// ── OFFICIAL GOOGLE PAY SVG BADGE ───────────────────────────────────────────────
export function GooglePayLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 123.84 104.9"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {/* Blue Ribbon */}
        <path
          fill="#4285F4"
          d="M65.7,63.18l30.4-52.66l16.56,9.56c10.69,6.17,14.36,19.85,8.18,30.54l-17.12,29.65 c-3.86,6.68-12.4,8.97-19.09,5.12l-15.37-8.87C64.6,73.81,63,67.84,65.7,63.18L65.7,63.18z"
        />
        {/* Yellow Ribbon */}
        <path
          fill="#FDBD00"
          d="M62.46,26.62l-37.82,65.5l16.56,9.56c10.69,6.17,24.37,2.51,30.54-8.18l24.53-42.49 c3.86-6.68,1.57-15.23-5.12-19.09l-15.37-8.87C71.12,20.35,65.16,21.95,62.46,26.62L62.46,26.62z"
        />
        {/* Green Ribbon */}
        <path
          fill="#2DA94F"
          d="M96.1,10.51L84.38,3.75C71.02-3.97,53.93,0.61,46.21,13.98L24.47,51.62c-3.86,6.68-1.57,15.23,5.12,19.09 l11.72,6.76c6.68,3.86,15.23,1.57,19.09-5.12l25.95-44.95l0,0c5.39-9.34,17.33-12.53,26.66-7.14L96.1,10.51L96.1,10.51z"
        />
        {/* Red Ribbon */}
        <path
          fill="#EA4335"
          d="M49.58,25.01l-12.93-7.45c-5.76-3.32-13.13-1.35-16.46,4.4L4.67,48.77c-7.64,13.2-3.11,30.08,10.12,37.7 l9.85,5.67l11.94,6.88l5.18,2.98c-9.2-6.16-12.12-18.5-6.5-28.21l4.02-6.94l14.71-25.42C57.32,35.69,55.35,28.33,49.58,25.01 L49.58,25.01z"
        />
      </g>
    </svg>
  )
}

// ── OFFICIAL VISA SVG BADGE ─────────────────────────────────────────────────────
export function VisaLogo({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 305.67"
      fillRule="evenodd"
      clipRule="evenodd"
      className={className}
    >
      <g fillRule="nonzero">
        <path
          fill="#94A3B8"
          d="M48.18 0h415.64c13.26 0 25.31 5.42 34.03 14.15C506.58 22.88 512 34.92 512 48.18V257.5c0 13.25-5.42 25.3-14.15 34.03s-20.77 14.15-34.03 14.15H48.18c-13.26 0-25.3-5.42-34.03-14.15S0 270.75 0 257.5V48.18c0-13.26 5.42-25.31 14.15-34.03C22.87 5.42 34.92 0 48.18 0zm415.64 16.6H48.18c-8.68 0-16.57 3.56-22.29 9.29-5.73 5.72-9.28 13.61-9.28 22.29V257.5c0 8.67 3.55 16.56 9.28 22.29 5.72 5.72 13.62 9.28 22.29 9.28h415.64c8.67 0 16.56-3.56 22.29-9.28 5.73-5.73 9.29-13.62 9.29-22.29V48.18c0-8.67-3.56-16.57-9.29-22.29-5.72-5.73-13.62-9.29-22.29-9.29z"
        />
        <path
          fill="#1434CB"
          d="M303.27 102.24c-22.18 0-42 11.49-42 32.73 0 24.35 35.15 26.04 35.15 38.27 0 5.16-5.9 9.77-15.99 9.77-14.31 0-25-6.45-25-6.45L250.85 198s12.32 5.44 28.68 5.44c24.25 0 43.33-12.06 43.33-33.66 0-25.74-35.3-27.37-35.3-38.73 0-4.03 4.85-8.45 14.9-8.45 11.35 0 20.61 4.68 20.61 4.68l4.48-20.7s-10.08-4.34-24.28-4.34zm-202.91 1.56l-.53 3.12s9.33 1.71 17.73 5.12c10.82 3.9 11.59 6.18 13.41 13.24l19.86 76.55h26.62l41.01-98.03H191.9l-26.35 66.65-10.75-56.5c-.99-6.47-5.98-10.15-12.1-10.15H100.36zm128.78 0l-20.83 98.03h25.32l20.76-98.03h-25.25zm141.25 0c-6.11 0-9.35 3.27-11.72 8.98l-37.1 89.05h26.56l5.13-14.85h32.36l3.12 14.85h23.43l-20.44-98.03h-21.34zm3.45 26.48l7.87 36.79h-21.09l13.22-36.79z"
        />
      </g>
    </svg>
  )
}

// ── UNIFIED SUPPORTED PAYMENT BADGES ROW ────────────────────────────────────────
export function SupportedPaymentBadges() {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
      {/* PhonePe */}
      <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border border-slate-200/90 hover:scale-105 transition-transform">
        <PhonePeLogo className="size-4 shrink-0" />
        <span className="text-[11px] font-black text-[#5F259F] tracking-tight leading-none">PhonePe</span>
      </div>

      {/* Google Pay */}
      <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border border-slate-200/90 hover:scale-105 transition-transform">
        <GooglePayLogo className="h-4 w-auto shrink-0" />
        <span className="text-[11px] font-black text-slate-800 tracking-tight leading-none">GPay</span>
      </div>

      {/* Paytm */}
      <div className="inline-flex items-center bg-white rounded-full px-2.5 py-1 shadow-sm border border-slate-200/90 hover:scale-105 transition-transform">
        <PaytmLogo className="h-4.5 w-auto" />
      </div>

      {/* Visa */}
      <div className="inline-flex items-center bg-white rounded-full px-2.5 py-1 shadow-sm border border-slate-200/90 hover:scale-105 transition-transform">
        <VisaLogo className="h-3.5 w-auto" />
      </div>
    </div>
  )
}

// ── WELCOME BONUS BANNER (HERO & TEASER VARIANTS) ─────────────────────────────────
interface WelcomeBonusBannerProps {
  variant?: "hero" | "teaser"
  onSwitchToRegister?: () => void
  className?: string
}

export function WelcomeBonusBanner({
  variant = "hero",
  onSwitchToRegister,
  className = "",
}: WelcomeBonusBannerProps) {
  if (variant === "teaser") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c1206] via-[#281809] to-[#120a03] p-4 text-center border border-amber-500/40 text-white shadow-xl ${className}`}
      >
        {/* Ambient atmospheric glow */}
        <div className="absolute -top-10 -left-10 size-32 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 size-32 rounded-full bg-yellow-400/15 blur-2xl pointer-events-none" />

        {/* Free New User Gift Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/40 mb-1.5">
          <SparklesIcon className="size-3 text-yellow-300 animate-pulse" />
          <span>Free New User Gift</span>
        </div>

        {/* Main Title */}
        <div className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-tight">
          ₹200 FREE WELCOME BONUS
        </div>

        {/* Hindi Tagline */}
        <p className="text-xs font-bold text-amber-100/90 mt-0.5 leading-snug">
          Register करें और पाएं{" "}
          <span className="text-yellow-300 font-extrabold underline decoration-yellow-400/50 underline-offset-2">
            ₹200 तक का Welcome Bonus
          </span>
        </p>

        {/* 4-Day Roadmap Pills */}
        <div className="mt-2.5 grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
          <div className="bg-amber-500/15 rounded-xl py-1.5 px-0.5 border border-amber-400/30 text-amber-200">
            <span className="text-[9px] text-amber-300/70 block uppercase">Day 1</span>
            <span className="font-black text-yellow-300">₹50</span>
          </div>
          <div className="bg-amber-500/15 rounded-xl py-1.5 px-0.5 border border-amber-400/30 text-amber-200">
            <span className="text-[9px] text-amber-300/70 block uppercase">Day 2</span>
            <span className="font-black text-yellow-300">₹50</span>
          </div>
          <div className="bg-amber-500/15 rounded-xl py-1.5 px-0.5 border border-amber-400/30 text-amber-200">
            <span className="text-[9px] text-amber-300/70 block uppercase">Day 3</span>
            <span className="font-black text-yellow-300">₹50</span>
          </div>
          <div className="bg-amber-500/15 rounded-xl py-1.5 px-0.5 border border-amber-400/30 text-amber-200">
            <span className="text-[9px] text-amber-300/70 block uppercase">Day 4</span>
            <span className="font-black text-yellow-300">₹50</span>
          </div>
        </div>

        {/* Payment Channels Strip */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col items-center justify-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/70 flex items-center gap-1">
            <ShieldCheckIcon className="size-2.5 text-emerald-400" />
            <span>Instant Payout Channels</span>
          </span>
          <SupportedPaymentBadges />
        </div>

        {/* Action Button to switch to Register */}
        {onSwitchToRegister && (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="mt-3.5 w-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 py-2.5 px-4 text-xs font-black text-slate-950 shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Register & Claim ₹200 Free Bonus</span>
            <ArrowRightIcon className="size-3.5" strokeWidth={3} />
          </button>
        )}
      </div>
    )
  }

  // Hero Variant (Default on Register Page / Register Tab)
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#1a1106] via-[#2a1b08] to-[#120a03] p-5 pt-6 text-white shadow-2xl border border-amber-500/40 text-center ${className}`}
    >
      {/* Ambient atmospheric glows */}
      <div className="absolute -top-12 -left-12 size-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 size-48 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-56 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />

      {/* Floating Top Badge: Free New User Gift */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/50 shadow-inner">
        <SparklesIcon className="size-3.5 text-yellow-300 animate-pulse" />
        <span>Free New User Gift</span>
      </div>

      {/* Big Highlighted ₹200 Header */}
      <div className="mt-3">
        <div className="inline-block relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.45)]">
            ₹200 FREE
          </h1>
          <span className="absolute -top-1 -right-7 rotate-12 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
            100%
          </span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase drop-shadow-sm mt-0.5">
          WELCOME BONUS
        </p>
      </div>

      {/* Hindi Tagline */}
      <p className="mt-1.5 text-xs sm:text-sm font-bold text-amber-100/90 leading-snug">
        Register करें और पाएं{" "}
        <span className="text-yellow-300 font-black underline underline-offset-2">
          ₹200 तक का Welcome Bonus
        </span>
      </p>

      {/* ── 4-DAY BONUS SCHEDULE BREAKDOWN ───────────────────────── */}
      <div className="mt-4 grid grid-cols-4 gap-1.5 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-amber-500/30 text-center">
        <div className="rounded-xl bg-amber-500/15 py-2 px-1 border border-amber-400/30">
          <span className="text-[10px] text-amber-200/80 font-bold block uppercase tracking-wider">Day 1</span>
          <span className="text-xs sm:text-sm font-black text-yellow-300">₹50</span>
        </div>
        <div className="rounded-xl bg-amber-500/15 py-2 px-1 border border-amber-400/30">
          <span className="text-[10px] text-amber-200/80 font-bold block uppercase tracking-wider">Day 2</span>
          <span className="text-xs sm:text-sm font-black text-yellow-300">₹50</span>
        </div>
        <div className="rounded-xl bg-amber-500/15 py-2 px-1 border border-amber-400/30">
          <span className="text-[10px] text-amber-200/80 font-bold block uppercase tracking-wider">Day 3</span>
          <span className="text-xs sm:text-sm font-black text-yellow-300">₹50</span>
        </div>
        <div className="rounded-xl bg-amber-500/15 py-2 px-1 border border-amber-400/30">
          <span className="text-[10px] text-amber-200/80 font-bold block uppercase tracking-wider">Day 4</span>
          <span className="text-xs sm:text-sm font-black text-yellow-300">₹50</span>
        </div>
      </div>

      {/* Total Bonus Result Banner */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-amber-200">
        <ZapIcon className="size-3.5 text-yellow-300" />
        <span>Total = ₹200 Direct Wallet Reward (Har Din ₹50)</span>
      </div>

      {/* ── SUPPORTED INSTANT PAYOUT CHANNELS ─────────────────────── */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col items-center justify-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
          <ShieldCheckIcon className="size-3 text-emerald-400" />
          <span>Supported Instant Payout Channels</span>
        </span>
        <SupportedPaymentBadges />
      </div>
    </div>
  )
}

