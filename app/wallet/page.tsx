"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  GiftIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserPlusIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { getPlan, type Entry } from "@/lib/game"
import { clockTime, dayLabel, fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const FILTERS = {
  All: () => true,
  Income: (e: Entry) => e.kind === "claim" || e.kind === "checkin",
  Purchases: (e: Entry) => e.kind === "buy",
  Bonuses: (e: Entry) => e.kind === "invite" || e.kind === "welcome",
}
type Filter = keyof typeof FILTERS

const PRESET_AMOUNTS = [300, 500, 1000, 2000, 5000, 10000]

export default function WalletPage() {
  const { ready: loaded, state } = useStore()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("All")
  const [depositAmt, setDepositAmt] = useState("300")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")

  if (!loaded) return <Skeleton />

  const sum = (f: (e: Entry) => boolean) =>
    state.history.filter(f).reduce((n, e) => n + Math.abs(e.coins), 0)
  const rows = state.history.filter(FILTERS[filter])

  async function handleDeposit() {
    const val = parseInt(depositAmt, 10)
    if (isNaN(val) || val < 100) {
      setPayError("Minimum recharge amount is ₹100")
      return
    }

    setPaying(true)
    setPayError("")

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setPayError("Please login to proceed with recharge.")
        setPaying(false)
        router.push("/login")
        return
      }

      if (!res.ok || !data.paymentUrl) {
        setPayError(data.error ?? "Failed to initiate payment gateway. Please try again.")
        setPaying(false)
        return
      }

      window.location.href = data.paymentUrl
    } catch {
      setPayError("Network error. Please try again.")
      setPaying(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-md mx-auto font-sans -mt-3">
      
      {/* ── TOP HEADER BANNER (Solar Gradient) ────────────────────────── */}
      <div className="relative -mx-3.5 px-5 pt-6 pb-12 rounded-b-[36px] bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-md text-white text-center overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-yellow-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-amber-950/30 blur-xl pointer-events-none" />

        <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
          My Wallet
        </h1>

        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-100">Total Balance</p>
          <p className="mt-1 text-4xl font-black text-white tracking-tight drop-shadow-sm">
            ₹{fmt(state.coins)}
          </p>
        </div>

        {/* Action button pills inside banner */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/wallet/withdraw"
            className="flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-5 py-2 text-xs font-extrabold text-amber-100 border border-white/20 hover:bg-black/40 active:scale-95 transition-all"
          >
            <BanknoteIcon className="size-3.5 text-yellow-300" />
            <span>Withdraw</span>
          </Link>

          <Link
            href="/my-plans"
            className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-5 py-2 text-xs font-extrabold text-white border border-white/25 hover:bg-white/30 active:scale-95 transition-all"
          >
            <ZapIcon className="size-3.5" />
            <span>My Plans</span>
          </Link>
        </div>
      </div>

      {/* ── RECHARGE DEPOSIT CARD (Overlapping Header) ────────────────── */}
      <div className="relative -mt-6 mx-1 rounded-[26px] bg-white p-5 shadow-xl shadow-amber-950/5 border border-amber-100/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">
            Recharge Wallet
          </h2>
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
            <ShieldCheckIcon className="size-3 text-emerald-600" />
            <span>Instant UPI</span>
          </span>
        </div>

        {/* Preset Amount Pills */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setDepositAmt(String(amt))
                setPayError("")
              }}
              className={cn(
                "rounded-2xl py-2.5 px-2 text-center transition-all cursor-pointer border text-xs font-extrabold",
                depositAmt === String(amt)
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-amber-50/40 text-slate-700 border-amber-200/70 hover:bg-amber-50"
              )}
            >
              ₹{fmt(amt)}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2">
          <span className="text-base font-black text-slate-500">₹</span>
          <input
            type="number"
            value={depositAmt}
            onChange={(e) => {
              setDepositAmt(e.target.value)
              setPayError("")
            }}
            placeholder="Enter recharge amount"
            className="flex-1 bg-transparent text-sm font-black text-slate-900 outline-none"
          />
        </div>

        {payError && (
          <p className="mt-2 text-xs text-red-600 font-semibold">{payError}</p>
        )}

        {/* Recharge Button */}
        <Button
          variant="buy"
          size="xl"
          disabled={paying}
          onClick={handleDeposit}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-3.5 text-slate-950 font-black shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
        >
          {paying ? (
            <span className="flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Opening Gateway…
            </span>
          ) : (
            <span>Recharge ₹{fmt(parseInt(depositAmt, 10) || 0)} via AeroPay</span>
          )}
        </Button>
      </div>

      {/* ── 3 WALLET STATS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Total Claimed</p>
          <p className="mt-1 text-sm font-black text-emerald-600">₹{fmt(sum(FILTERS.Income))}</p>
          <p className="text-[10px] text-slate-400">Daily earnings</p>
        </div>

        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Total Spent</p>
          <p className="mt-1 text-sm font-black text-slate-800">₹{fmt(sum(FILTERS.Purchases))}</p>
          <p className="text-[10px] text-slate-400">On solar plans</p>
        </div>

        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Referral Bonus</p>
          <p className="mt-1 text-sm font-black text-amber-700">₹{fmt(sum(FILTERS.Bonuses))}</p>
          <p className="text-[10px] text-slate-400">Team rewards</p>
        </div>
      </div>

      {/* ── TRANSACTION HISTORY ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900">
            Transaction History
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {rows.length} records
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 rounded-full bg-white p-1 border border-amber-200/80 shadow-xs overflow-x-auto">
          {(Object.keys(FILTERS) as Filter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 py-1 px-3 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap",
                filter === tab
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transaction Rows */}
        <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions found in this category.
            </div>
          ) : (
            rows.slice(0, 20).map((entry) => {
              const isPositive = entry.coins > 0
              let title = "Reward"
              if (entry.kind === "claim") {
                title = `Daily Return · ${getPlan(entry.planId).name}`
              } else if (entry.kind === "buy") {
                title = `Purchased ${getPlan(entry.planId).name}`
              } else if (entry.kind === "checkin") {
                title = `Check-in bonus (Day ${entry.streakDay})`
              } else if (entry.kind === "invite") {
                title = "Referral commission"
              } else if (entry.kind === "welcome") {
                title = "Welcome gift bonus"
              }

              return (
                <div key={entry.id} className="flex items-center justify-between p-3.5 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl font-bold shadow-xs",
                        isPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isPositive ? <ArrowDownLeftIcon className="size-4.5" /> : <ArrowUpRightIcon className="size-4.5" />}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[210px]">{title}</p>
                      <p className="text-[10px] text-slate-400">{dayLabel(entry.at, Date.now())} · {clockTime(entry.at)}</p>
                    </div>
                  </div>

                  <p className={cn("text-sm font-black", isPositive ? "text-emerald-600" : "text-slate-800")}>
                    {isPositive ? `+₹${fmt(entry.coins)}` : `-₹${fmt(Math.abs(entry.coins))}`}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
