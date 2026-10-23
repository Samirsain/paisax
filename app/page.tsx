"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
  Share2Icon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StarIcon,
  TrendingUpIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { BuySheet } from "@/components/buy-sheet"
import { WelcomeModal } from "@/components/welcome-modal"
import { Skeleton } from "@/components/marks"
import { PLANS, active, type Plan, type PlanId } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const LIVE_TICKER_LIST = [
  { name: "Rajesh S.", city: "Jaipur", amount: 18450, time: "Just now" },
  { name: "Priya P.", city: "Surat", amount: 8900, time: "1m ago" },
  { name: "Vikram C.", city: "Lucknow", amount: 24600, time: "2m ago" },
  { name: "Manoj T.", city: "Patna", amount: 48000, time: "3m ago" },
  { name: "Ananya I.", city: "Bengaluru", amount: 12000, time: "4m ago" },
  { name: "Amit V.", city: "Indore", amount: 36800, time: "5m ago" },
  { name: "Deepak Y.", city: "Delhi", amount: 6500, time: "7m ago" },
]

const WITHDRAWAL_TESTIMONIALS = [
  {
    name: "Rajesh Sharma",
    city: "Jaipur, Rajasthan",
    avatar: "/avatar/1.png",
    amount: 18450,
    plan: "Solar Mega Station 2000",
    time: "Today at 11:34 AM",
    utr: "IMPS/428190381029",
    comment: "Bhai sach me PaisaX Solar sabse best hai! Pehle lagta tha fake hoga, par kal ₹18,450 ka withdrawal lagaya aur 3 minute me direct bank account me credit ho gaya. Daily withdrawal option is unbeatable!",
  },
  {
    name: "Priya Patel",
    city: "Ahmedabad, Gujarat",
    avatar: "/avatar/2.png",
    amount: 8900,
    plan: "Solar Pro Grid 1000",
    time: "Today at 10:15 AM",
    utr: "IMPS/428177401928",
    comment: "Roz subah 10 baje ₹150 ki pakki income wallet me aati hai. Main pichle 20 din se use kar rahi hu, ab tak ₹8,900 nikal chuki hu bina kisi issue ke. Sabse genuine earning platform!",
  },
  {
    name: "Vikram Chauhan",
    city: "Lucknow, UP",
    avatar: "/avatar/3.png",
    amount: 36800,
    plan: "Solar Industrial Plant",
    time: "Yesterday",
    utr: "IMPS/428100912384",
    comment: "Maine ₹10,000 wala VIP plan choose kiya tha. Har din ₹1,900 guaranteed milte hai. Ab tak total ₹36,800 withdraw kar chuka hu IMPS ke through. Paisa turant bank me aata hai.",
  },
  {
    name: "Sunita Deshmukh",
    city: "Pune, Maharashtra",
    avatar: "/avatar/4.png",
    amount: 48000,
    plan: "Solar Megawatt Farm",
    time: "Yesterday",
    utr: "RTGS/428091823901",
    comment: "₹50,000 ka Mega Farm plan liya tha. Kal ₹48,000 ka withdrawal request dala aur shaam tak bank account me poora paisa aa gaya. 100% genuine and safe for Indian investors!",
  },
]

export default function HomePage() {
  const { ready: loaded, state } = useStore()
  const [buying, setBuying] = useState<PlanId | null>(null)
  const [tab, setTab] = useState<"normal" | "vip">("normal")
  const [bannerIdx, setBannerIdx] = useState(0)
  const [tickerIdx, setTickerIdx] = useState(0)

  // Live rotating ticker timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % LIVE_TICKER_LIST.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  if (!loaded) return <Skeleton />

  const banners = [
    {
      src: "/dairymilk/bannerr.png",
      alt: "PaisaX Solar Energy",
    },
    {
      src: "/dairymilk/product.png",
      alt: "PaisaX Solar Power Station",
    },
  ]

  const normalPlans = PLANS.filter((p) => p.category === "normal")
  const vipPlans = PLANS.filter((p) => p.category === "vip")
  const displayPlans = tab === "normal" ? normalPlans : vipPlans
  const currentTicker = LIVE_TICKER_LIST[tickerIdx]

  return (
    <div className="flex flex-col gap-4 pb-8 max-w-md mx-auto font-sans">
      
      {/* Welcome Modal (shown automatically on signup or first visit) */}
      <WelcomeModal />

      {/* ── TOP CAROUSEL BANNER (Using user's bannerr.png) ─────────────── */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm aspect-[16/9] bg-[#0c101d] ring-1 ring-amber-400/20">
        <Image
          src={banners[bannerIdx].src}
          alt={banners[bannerIdx].alt}
          fill
          className="object-cover transition-all duration-500"
          priority
        />
        
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Carousel Prev/Next Buttons */}
        <button
          type="button"
          aria-label="Previous banner"
          onClick={() => setBannerIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeftIcon className="size-4.5" />
        </button>

        <button
          type="button"
          aria-label="Next banner"
          onClick={() => setBannerIdx((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRightIcon className="size-4.5" />
        </button>

        {/* Indicator dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                bannerIdx === i ? "w-5 bg-amber-400" : "w-1.5 bg-white/60"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── LIVE WITHDRAWAL NOTIFICATION TICKER ───────────────────────── */}
      <div className="flex items-center gap-2.5 rounded-full bg-amber-50/90 border border-amber-200/80 px-3.5 py-1.5 shadow-xs overflow-hidden">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
          <CheckCircle2Icon className="size-3" />
        </span>
        <div className="flex-1 min-w-0 flex items-center justify-between text-[11px]">
          <p className="truncate text-slate-700 font-bold">
            <span className="text-slate-900">{currentTicker.name}</span> ({currentTicker.city}) received{" "}
            <span className="text-emerald-700 font-black">₹{fmt(currentTicker.amount)}</span> payout
          </p>
          <span className="text-[10px] text-amber-800 font-extrabold shrink-0 ml-2 bg-amber-100/70 px-1.5 py-0.2 rounded-full">
            {currentTicker.time}
          </span>
        </div>
      </div>

      {/* ── 3 QUICK ACTIONS (Recharge, Withdraw, Invite in Solar Yellow) ─ */}
      <div className="grid grid-cols-3 gap-3 pt-0.5">
        
        {/* Recharge */}
        <Link
          href="/wallet"
          className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 shadow-xs border border-amber-100 active:scale-95 transition-all hover:shadow-sm"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white shadow-xs">
            <WalletIcon className="size-5" />
          </span>
          <span className="mt-1.5 text-xs font-bold text-slate-800">Recharge</span>
        </Link>

        {/* Withdraw */}
        <Link
          href="/wallet/withdraw"
          className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 shadow-xs border border-amber-100 active:scale-95 transition-all hover:shadow-sm"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-slate-900 shadow-xs">
            <GiftIcon className="size-5" />
          </span>
          <span className="mt-1.5 text-xs font-bold text-slate-800">Withdraw</span>
        </Link>

        {/* Invite */}
        <Link
          href="/refer"
          className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 shadow-xs border border-amber-100 active:scale-95 transition-all hover:shadow-sm"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#b45309] text-white shadow-xs">
            <Share2Icon className="size-5" />
          </span>
          <span className="mt-1.5 text-xs font-bold text-slate-800">Invite</span>
        </Link>
      </div>

      {/* ── PLAN CATEGORY TABS (Normal Plan vs VIP Plan in Solar Yellow) ── */}
      <div className="flex rounded-full bg-white p-1 border border-amber-200 shadow-xs">
        <button
          type="button"
          onClick={() => setTab("normal")}
          className={cn(
            "flex-1 py-2 text-sm font-black rounded-full transition-all cursor-pointer",
            tab === "normal"
              ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          Normal Plan
        </button>
        <button
          type="button"
          onClick={() => setTab("vip")}
          className={cn(
            "flex-1 py-2 text-sm font-black rounded-full transition-all cursor-pointer",
            tab === "vip"
              ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          VIP Plan
        </button>
      </div>

      {/* ── PRODUCT PLAN CARDS (EXACT LAYOUT IN SOLAR YELLOW) ─────────── */}
      <div className="flex flex-col gap-3.5">
        {displayPlans.map((plan) => (
          <ProductCard
            key={plan.id}
            plan={plan}
            onBuy={() => setBuying(plan.id)}
          />
        ))}
      </div>

      {/* ── REAL WITHDRAWAL TESTIMONIALS & PAYMENT PROOFS ─────────────── */}
      <div className="flex flex-col gap-3 mt-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] font-black text-amber-800">4.9/5 Rating</span>
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
              Recent Withdrawal Proofs
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheckIcon className="size-3 text-emerald-600" />
            <span>100% Verified</span>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {WITHDRAWAL_TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[26px] bg-white p-4 shadow-sm border border-amber-100 flex flex-col gap-2.5 transition-all hover:shadow-md"
            >
              {/* Top row: User avatar + Name & City + Withdrawn Amount Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative size-10 rounded-full overflow-hidden border-2 border-amber-300 ring-1 ring-amber-400/30 shrink-0">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-black text-slate-900">{t.name}</p>
                      <CheckCircle2Icon className="size-3 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{t.city}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700 border border-emerald-200">
                    +₹{fmt(t.amount)}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">{t.time}</p>
                </div>
              </div>

              {/* User review text */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60">
                &ldquo;{t.comment}&rdquo;
              </p>

              {/* Footer info: Plan + UTR verification stamp */}
              <div className="flex items-center justify-between text-[10px] pt-0.5">
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                  {t.plan}
                </span>
                <span className="font-mono text-slate-400">
                  {t.utr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Sheet modal */}
      <BuySheet planId={buying} onClose={() => setBuying(null)} />
    </div>
  )
}

/** Exact plan card layout matching reference image with Solar Yellow colors */
function ProductCard({ plan, onBuy }: { plan: Plan; onBuy: () => void }) {
  const { state } = useStore()
  const isFreeActive = plan.id === "free" && state.owned.some((o) => o.planId === "free")
  const totalReturn = plan.perDay * plan.days

  return (
    <article className="rounded-[28px] bg-white p-4.5 shadow-sm border border-amber-100 flex flex-col gap-3.5 transition-all hover:shadow-md hover:border-amber-300">
      
      {/* Title */}
      <h3 className="text-[19px] font-black text-[#0f172a] tracking-tight">
        {plan.name}
      </h3>

      {/* Middle Grid: Left Thumbnail + Right Metrics */}
      <div className="flex items-center gap-3.5">
        
        {/* Left Thumbnail with Limit 0/10 badge */}
        <div className="relative w-[140px] h-[105px] rounded-2xl overflow-hidden shrink-0 shadow-xs border border-amber-100 bg-amber-50/50">
          <Image
            src={plan.image || "/dairymilk/product.png"}
            alt={plan.name}
            fill
            className="object-cover"
          />
          {/* Limit badge on top-left corner */}
          <span className="absolute top-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-xs">
            {plan.limit || "Limit 0/10"}
          </span>
        </div>

        {/* Right Details with 4 rows separated by dashed lines */}
        <div className="flex-1 flex flex-col text-xs">
          
          {/* Row 1: Price */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Price
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(plan.cost)}
            </span>
          </div>

          {/* Row 2: Daily */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Daily
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(plan.perDay)}
            </span>
          </div>

          {/* Row 3: Total */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-amber-200/80">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              Total
            </span>
            <span className="text-[16px] font-black text-[#d97706]">
              ₹{fmt(totalReturn)}
            </span>
          </div>

          {/* Row 4: End day */}
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="size-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              End day
            </span>
            <span className="text-[15px] font-black text-slate-900">
              {plan.days} day
            </span>
          </div>
        </div>
      </div>

      {/* Full-width Buy Now CTA Button in Solar Yellow Gradient */}
      {isFreeActive ? (
        <div className="w-full mt-0.5 flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-2.5 px-4 text-emerald-800 text-xs font-black border border-emerald-200">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <span>Free Plan Already Active (Limit 1/1)</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          className="w-full mt-0.5 flex items-center justify-between rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-2.5 pl-6 pr-2.5 text-slate-950 font-black shadow-md shadow-amber-500/25 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span className="flex-1 text-center text-[15px] font-black tracking-tight flex items-center justify-center gap-1.5">
            {plan.cost === 0 ? "Activate Free Plan 🎁" : <>Buy Now <span className="text-base">🛒</span></>}
          </span>
          <span className="flex size-7.5 items-center justify-center rounded-full bg-slate-950 text-amber-400 shadow-xs shrink-0 font-black">
            &gt;
          </span>
        </button>
      )}
    </article>
  )
}
