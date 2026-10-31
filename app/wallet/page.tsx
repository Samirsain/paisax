"use client"

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
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
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  AlertTriangleIcon,
  ZapIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { getPlan, type Entry } from "@/lib/game"
import { clockTime, dayLabel, fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface RealTxItem {
  id: string
  type: "deposit" | "withdrawal" | "claim" | "commission" | "giftcard"
  title: string
  amount: number
  netAmount?: number
  status: "SUCCESS" | "PENDING" | "FAILED"
  date: string | number
  timestamp: number
  reference?: string
  note?: string
  meta?: any
}

const PRESET_AMOUNTS = [300, 500, 1000, 2000, 5000, 10000]

type TxFilter = "All" | "Deposits" | "Withdrawals" | "Returns" | "Bonuses"

export default function WalletPage() {
  const { ready: loaded, state, syncWithServer, creditWallet } = useStore()
  const router = useRouter()

  const [depositAmt, setDepositAmt] = useState("300")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")

  const [giftCode, setGiftCode] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Real DB transaction records
  const [dbTransactions, setDbTransactions] = useState<RealTxItem[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [activeFilter, setActiveFilter] = useState<TxFilter>("All")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load real database transactions
  async function loadTransactions() {
    setLoadingTx(true)
    try {
      const res = await fetch("/api/wallet/transactions")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.transactions)) {
          setDbTransactions(data.transactions)
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingTx(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  // Combine real DB records with local daily return claims
  const combinedTransactions = useMemo(() => {
    const list: RealTxItem[] = [...dbTransactions]
    const existingIds = new Set(dbTransactions.map((t) => t.id))

    // Merge in daily claim entries from game history
    if (Array.isArray(state?.history)) {
      for (const h of state.history) {
        if (!existingIds.has(h.id)) {
          if (h.kind === "claim") {
            list.push({
              id: h.id,
              type: "claim",
              title: `Daily Return · ${getPlan(h.planId)?.name || "Solar Plan"}`,
              amount: h.coins,
              status: "SUCCESS",
              date: h.at,
              timestamp: h.at,
            })
          } else if (h.kind === "checkin") {
            list.push({
              id: h.id,
              type: "claim",
              title: `Daily Check-in (Day ${h.streakDay || 1})`,
              amount: h.coins,
              status: "SUCCESS",
              date: h.at,
              timestamp: h.at,
            })
          }
        }
      }
    }

    // Sort descending by timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp)
  }, [dbTransactions, state?.history])

  // Filter items
  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case "Deposits":
        return combinedTransactions.filter((t) => t.type === "deposit")
      case "Withdrawals":
        return combinedTransactions.filter((t) => t.type === "withdrawal")
      case "Returns":
        return combinedTransactions.filter((t) => t.type === "claim")
      case "Bonuses":
        return combinedTransactions.filter((t) => t.type === "commission" || t.type === "giftcard")
      default:
        return combinedTransactions
    }
  }, [combinedTransactions, activeFilter])

  // Dynamic counts for tab pills
  const counts = useMemo(() => {
    return {
      All: combinedTransactions.length,
      Deposits: combinedTransactions.filter((t) => t.type === "deposit").length,
      Withdrawals: combinedTransactions.filter((t) => t.type === "withdrawal").length,
      Returns: combinedTransactions.filter((t) => t.type === "claim").length,
      Bonuses: combinedTransactions.filter((t) => t.type === "commission" || t.type === "giftcard").length,
    }
  }, [combinedTransactions])

  // Copy helper
  async function copyRef(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Transaction reference copied")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error(`Ref: ${text}`)
    }
  }

  if (!loaded) return <Skeleton />

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

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    const code = giftCode.trim().toUpperCase()
    if (!code) return
    setRedeeming(true)
    setRedeemMsg(null)
    try {
      const res = await fetch("/api/wallet/gift-card/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok) {
        creditWallet(data.amount, data.code)
        setRedeemMsg({ ok: true, text: `₹${data.amount} credited directly to your wallet!` })
        setGiftCode("")
        toast.success(`🎉 Gift card redeemed! ₹${data.amount} added to your wallet.`)
        await syncWithServer()
        loadTransactions()
      } else {
        setRedeemMsg({ ok: false, text: data.error || "Invalid or expired gift card code." })
      }
    } catch {
      setRedeemMsg({ ok: false, text: "Network error. Please try again." })
    } finally {
      setRedeeming(false)
    }
  }

  // Summary stats calculations
  const totalClaimed = combinedTransactions
    .filter((t) => t.type === "claim" && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDeposited = combinedTransactions
    .filter((t) => t.type === "deposit" && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalBonus = combinedTransactions
    .filter((t) => (t.type === "commission" || t.type === "giftcard") && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0)

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
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link
            href="/wallet/withdraw"
            className="flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-3.5 py-2 text-xs font-extrabold text-amber-100 border border-white/20 hover:bg-black/40 active:scale-95 transition-all"
          >
            <BanknoteIcon className="size-3.5 text-yellow-300" />
            <span>Withdraw</span>
          </Link>

          <a
            href="#giftcard"
            className="flex items-center gap-1.5 rounded-full bg-yellow-400 text-slate-950 px-3.5 py-2 text-xs font-black shadow-md hover:bg-yellow-300 active:scale-95 transition-all"
          >
            <SparklesIcon className="size-3.5" />
            <span>Gift Voucher</span>
          </a>

          <a
            href="#history"
            className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-2 text-xs font-extrabold text-white border border-white/25 hover:bg-white/30 active:scale-95 transition-all"
          >
            <HistoryIcon className="size-3.5" />
            <span>Records</span>
          </a>
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

      {/* ── GIFT CARD REDEEM CARD (High Visibility, Zero Scroll Needed) ── */}
      <div id="giftcard" className="mx-1 rounded-[24px] bg-gradient-to-br from-amber-50 via-white to-orange-50/40 p-4 border-2 border-dashed border-amber-300 shadow-sm relative overflow-hidden scroll-mt-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black shadow-xs">
              <GiftIcon className="size-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">
                  Redeem Gift Card / Voucher
                </h3>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">
                  INSTANT
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500">
                Enter code to get funds directly credited to your wallet
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRedeem} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={giftCode}
              onChange={(e) => {
                setGiftCode(e.target.value.toUpperCase())
                setRedeemMsg(null)
              }}
              placeholder="ENTER GIFT CODE (e.g. GIFT-XXXX)"
              maxLength={25}
              className="w-full h-11 rounded-xl bg-white border border-amber-200 px-3.5 text-xs font-black text-slate-900 tracking-wider uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 placeholder:tracking-normal focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 outline-none shadow-xs"
            />
          </div>
          <Button
            type="submit"
            disabled={redeeming || !giftCode.trim()}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0 hover:opacity-95"
          >
            {redeeming ? (
              <Loader2Icon className="size-4 animate-spin text-slate-950" />
            ) : (
              <span className="flex items-center gap-1.5">
                <SparklesIcon className="size-3.5" />
                Claim
              </span>
            )}
          </Button>
        </form>

        {redeemMsg && (
          <div className={cn(
            "mt-2.5 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-150",
            redeemMsg.ok 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          )}>
            {redeemMsg.ok ? (
              <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangleIcon className="size-4 text-red-600 shrink-0" />
            )}
            <span>{redeemMsg.text}</span>
          </div>
        )}
      </div>

      {/* ── 3 WALLET STATS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Total Claimed</p>
          <p className="mt-1 text-sm font-black text-emerald-600">₹{fmt(totalClaimed)}</p>
          <p className="text-[10px] text-slate-400">Daily earnings</p>
        </div>

        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Total Deposited</p>
          <p className="mt-1 text-sm font-black text-slate-800">₹{fmt(totalDeposited)}</p>
          <p className="text-[10px] text-slate-400">Confirmed UPI</p>
        </div>

        <div className="rounded-2xl bg-white p-3 border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-semibold text-slate-400">Referral & Gift</p>
          <p className="mt-1 text-sm font-black text-amber-700">₹{fmt(totalBonus)}</p>
          <p className="text-[10px] text-slate-400">Bonus credits</p>
        </div>
      </div>

      {/* ── UNIFIED REAL TRANSACTION HISTORY ─────────────────────────── */}
      <div id="history" className="flex flex-col gap-2 mt-1 scroll-mt-20">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Transaction History</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {filteredRows.length}
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Live updates: deposits, bank payouts & returns
            </p>
          </div>

          <button
            type="button"
            onClick={loadTransactions}
            disabled={loadingTx}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
            title="Refresh transactions"
          >
            <RefreshCwIcon className={cn("size-3", loadingTx && "animate-spin text-amber-600")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 rounded-2xl bg-white p-1 border border-amber-200/80 shadow-xs overflow-x-auto">
          {(["All", "Deposits", "Withdrawals", "Returns", "Bonuses"] as TxFilter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap text-center",
                activeFilter === tab
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>{tab}</span>
              <span className={cn(
                "ml-1 text-[10px] font-black opacity-80",
                activeFilter === tab ? "text-slate-950" : "text-slate-400"
              )}>
                ({counts[tab]})
              </span>
            </button>
          ))}
        </div>

        {/* Transaction Records List */}
        <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
          {filteredRows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <HistoryIcon className="size-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">No transaction records in this category</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                New recharge deposits, withdrawals and daily earnings will appear here live.
              </p>
            </div>
          ) : (
            filteredRows.slice(0, 50).map((tx) => {
              const isSuccess = tx.status === "SUCCESS"
              const isPending = tx.status === "PENDING"
              const isFailed = tx.status === "FAILED"
              const isCredit = tx.type === "deposit" || tx.type === "claim" || tx.type === "commission" || tx.type === "giftcard"

              return (
                <div key={tx.id} className="flex items-center justify-between p-3.5 hover:bg-amber-50/30 transition-colors">
                  
                  {/* Left Icon + Details */}
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    
                    {/* Icon Box */}
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs border",
                        tx.type === "deposit" && isSuccess && "bg-emerald-50 text-emerald-600 border-emerald-200",
                        tx.type === "deposit" && isPending && "bg-amber-50 text-amber-600 border-amber-200",
                        tx.type === "deposit" && isFailed && "bg-rose-50 text-rose-600 border-rose-200",
                        tx.type === "withdrawal" && isSuccess && "bg-slate-100 text-slate-800 border-slate-200",
                        tx.type === "withdrawal" && isPending && "bg-amber-50 text-amber-600 border-amber-200 animate-pulse",
                        tx.type === "withdrawal" && isFailed && "bg-rose-50 text-rose-600 border-rose-200",
                        (tx.type === "claim" || tx.type === "commission" || tx.type === "giftcard") &&
                          "bg-amber-50 text-amber-600 border-amber-200"
                      )}
                    >
                      {tx.type === "deposit" ? (
                        <ArrowDownLeftIcon className="size-4.5" />
                      ) : tx.type === "withdrawal" ? (
                        <ArrowUpRightIcon className="size-4.5" />
                      ) : (
                        <CoinsIcon className="size-4.5" />
                      )}
                    </span>

                    {/* Text Details */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {tx.title}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {typeof tx.date === "number"
                            ? dayLabel(tx.date, Date.now()) + " · " + clockTime(tx.date)
                            : new Date(tx.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                        </span>

                        {tx.reference && (
                          <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            <span className="truncate max-w-[100px]">{tx.reference}</span>
                            <button
                              type="button"
                              onClick={() => copyRef(tx.reference!, tx.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy Ref"
                            >
                              {copiedId === tx.id ? (
                                <CheckIcon className="size-2.5 text-emerald-600" />
                              ) : (
                                <CopyIcon className="size-2.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Note / failure explanation */}
                      {tx.note && (
                        <p className={cn(
                          "text-[10px] mt-0.5 font-semibold",
                          isFailed ? "text-rose-600" : "text-slate-500"
                        )}>
                          {isFailed ? "⚠️ " : "ℹ️ "}{tx.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Amount & Status Badge */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-black tracking-tight",
                      isFailed && tx.type === "deposit"
                        ? "line-through text-slate-400"
                        : isCredit
                        ? "text-emerald-600"
                        : "text-slate-900"
                    )}>
                      {isCredit ? `+₹${fmt(tx.amount)}` : `-₹${fmt(tx.amount)}`}
                    </p>

                    {/* Status Pill */}
                    <div className="mt-1 flex justify-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-black border",
                          isSuccess && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          isPending && "bg-amber-50 text-amber-800 border-amber-200 animate-pulse",
                          isFailed && "bg-rose-50 text-rose-700 border-rose-200"
                        )}
                      >
                        {isSuccess ? (
                          <CheckCircle2Icon className="size-2.5 text-emerald-600" />
                        ) : isPending ? (
                          <ClockIcon className="size-2.5 text-amber-600" />
                        ) : (
                          <AlertTriangleIcon className="size-2.5 text-rose-600" />
                        )}
                        <span>{tx.status}</span>
                      </span>
                    </div>

                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
