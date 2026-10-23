"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BanknoteIcon,
  Building2Icon,
  CheckCircle2Icon,
  ClockIcon,
  HelpCircleIcon,
  InfoIcon,
  LockIcon,
  ShieldCheckIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { canWithdrawToday, hasBoughtPaidPlan, WITHDRAW_FEE_PCT, WITHDRAW_MIN } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { BankIcon } from "@/components/payment-icons"

const INDIAN_PAYOUTS_POOL = [
  { name: "Rajesh Sharma", amount: 18450, time: "Just now", method: "Bank IMPS", avatar: "/avatar/1.png" },
  { name: "Priya Patel", amount: 8900, time: "1 min ago", method: "Bank IMPS", avatar: "/avatar/2.png" },
  { name: "Vikram Chauhan", amount: 24600, time: "2 min ago", method: "Bank IMPS", avatar: "/avatar/3.png" },
  { name: "Ananya Iyer", amount: 12000, time: "3 min ago", method: "Bank NEFT", avatar: "/avatar/4.png" },
  { name: "Amit Verma", amount: 36800, time: "4 min ago", method: "Bank IMPS", avatar: "/avatar/1.png" },
  { name: "Deepak Yadav", amount: 6500, time: "6 min ago", method: "Bank IMPS", avatar: "/avatar/2.png" },
  { name: "Sunita Deshmukh", amount: 15200, time: "7 min ago", method: "Bank IMPS", avatar: "/avatar/3.png" },
  { name: "Manoj Tiwari", amount: 48000, time: "9 min ago", method: "Bank NEFT", avatar: "/avatar/4.png" },
  { name: "Pooja Choudhary", amount: 9800, time: "11 min ago", method: "Bank IMPS", avatar: "/avatar/1.png" },
  { name: "Suresh Reddy", amount: 28500, time: "13 min ago", method: "Bank IMPS", avatar: "/avatar/2.png" },
  { name: "Neha Gupta", amount: 11400, time: "15 min ago", method: "Bank IMPS", avatar: "/avatar/3.png" },
  { name: "Rohit Singhania", amount: 52000, time: "18 min ago", method: "Bank IMPS", avatar: "/avatar/4.png" },
]

export default function WithdrawPage() {
  const { ready: loaded, state, withdraw } = useStore()
  const [amount, setAmount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [ifsc, setIfsc] = useState("")
  const [step, setStep] = useState<"form" | "success">("form")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [withdrawalInfo, setWithdrawalInfo] = useState<{
    id: string
    amount: number
    fee: number
    netPayout: number
    accountNumber: string
    ifsc: string
  } | null>(null)
  const [payouts, setPayouts] = useState(INDIAN_PAYOUTS_POOL.slice(0, 5))
  const [pulseIdx, setPulseIdx] = useState<number | null>(null)

  // Live rotating payouts with real Indian names & high amounts
  useEffect(() => {
    let poolIndex = 5
    const timer = setInterval(() => {
      const next = {
        ...INDIAN_PAYOUTS_POOL[poolIndex % INDIAN_PAYOUTS_POOL.length],
        time: "Just now",
      }
      poolIndex++
      setPayouts((prev) => [next, ...prev.slice(0, 4)])
      setPulseIdx(0)
      setTimeout(() => setPulseIdx(null), 1200)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  if (!loaded) return <Skeleton />

  const today = canWithdrawToday()
  const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" })
  const coins = state.coins
  const available = Math.max(0, coins)
  const amt = parseInt(amount, 10) || 0
  const fee = Math.round((amt * WITHDRAW_FEE_PCT) / 100)
  const netPayout = Math.max(0, amt - fee)
  const hasPaidPlan = hasBoughtPaidPlan(state)

  const isFormValid =
    today &&
    hasPaidPlan &&
    amt >= WITHDRAW_MIN &&
    amt <= available &&
    Boolean(accountName.trim()) &&
    Boolean(accountNumber.trim()) &&
    accountNumber.trim() === confirmAccountNumber.trim() &&
    Boolean(ifsc.trim()) &&
    !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasPaidPlan) {
      setError("Withdrawal locked! Pehle koi bhi paid solar plan khareedein tabhi payout unlock hoga.")
      toast.error("Withdrawal locked! Please activate a paid solar plan first.")
      return
    }
    if (!today) {
      setError(`Withdrawals are closed on weekends (${dayName}). Please request on Monday.`)
      return
    }
    if (isNaN(amt) || amt < WITHDRAW_MIN) {
      setError(`Minimum withdrawal amount is ₹${WITHDRAW_MIN}`)
      return
    }
    if (amt > available) {
      setError(`Withdrawal amount exceeds your available balance (₹${fmt(available)})`)
      return
    }
    if (!accountName.trim()) {
      setError("Please enter Account Holder Name")
      return
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      setError("Please enter a valid Bank Account Number")
      return
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setError("Account numbers do not match! Please check carefully.")
      return
    }
    if (!ifsc.trim() || ifsc.trim().length < 4) {
      setError("Please enter a valid Bank IFSC Code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
          ifsc: ifsc.trim().toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Withdrawal request failed")
      }

      // Deduct locally in store
      try {
        withdraw(amt, "bank")
      } catch {
        // Ignored if local state syncs with server later
      }

      setWithdrawalInfo({
        id: data.withdrawal?.id || `W_${Date.now()}`,
        amount: amt,
        fee,
        netPayout,
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      })

      setStep("success")
      toast.success("Bank withdrawal request submitted successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
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
          Bank Withdrawal
        </h1>

        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-100">Available Balance</p>
          <p className="mt-1 text-4xl font-black text-white tracking-tight drop-shadow-sm">
            ₹{fmt(available)}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-100">
          <ShieldCheckIcon className="size-3.5 text-yellow-300" />
          <span>Direct Bank Payouts · Min ₹{WITHDRAW_MIN} · 3% Tax Fee</span>
        </div>
      </div>

      {/* ── WEEKEND WARNING (If Saturday/Sunday) ──────────────────────── */}
      {!today && (
        <div className="mx-1 rounded-2xl bg-amber-50 p-4 border border-amber-300/80 flex items-start gap-3">
          <XCircleIcon className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-950">Withdrawals Closed Today ({dayName})</p>
            <p className="text-[11px] text-amber-900 mt-0.5">
              Banking channels process withdrawals Monday to Friday (10 AM to 6 PM). Requests open on Monday morning.
            </p>
          </div>
        </div>
      )}

      {step === "success" ? (
        /* ── SUCCESS STATE ─────────────────────────────────────────── */
        <div className="rounded-[32px] bg-white p-7 text-center shadow-lg border border-amber-100 flex flex-col items-center">
          <div className="flex size-18 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-inner">
            <CheckCircle2Icon className="size-10" />
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Bank Transfer Initiated!
          </h2>
          <p className="mt-1.5 max-w-[280px] text-xs font-medium text-slate-500 leading-relaxed">
            Your payout of <strong className="text-emerald-700">₹{fmt(withdrawalInfo?.netPayout || netPayout)}</strong> has been recorded and will be directly credited to your bank account.
          </p>

          <div className="mt-5 w-full rounded-2xl bg-amber-50/50 p-4 border border-amber-200 text-left text-xs divide-y divide-amber-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Request ID</span>
              <span className="font-mono font-bold text-slate-700 text-[11px]">{withdrawalInfo?.id}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Requested Amount</span>
              <span className="font-bold text-slate-900">₹{fmt(withdrawalInfo?.amount || amt)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Service Fee ({WITHDRAW_FEE_PCT}%)</span>
              <span className="font-bold text-slate-700">-₹{fmt(withdrawalInfo?.fee || fee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-bold text-slate-900">Net Credit to Bank</span>
              <span className="font-black text-emerald-600 text-sm">₹{fmt(withdrawalInfo?.netPayout || netPayout)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-bold text-slate-800">
                •••• {withdrawalInfo?.accountNumber?.slice(-4) || "••••"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">IFSC Code</span>
              <span className="font-mono font-bold text-slate-800">{withdrawalInfo?.ifsc}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Channel</span>
              <span className="font-bold text-amber-800">Bank Transfer (IMPS/NEFT)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("form")
              setAmount("")
              setAccountNumber("")
              setConfirmAccountNumber("")
            }}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-extrabold text-white shadow-md active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : !hasPaidPlan ? (
        /* ── LOCKED WITHDRAWAL CARD (Paid Plan Required) ──────────── */
        <div className="relative -mt-6 mx-1 rounded-[26px] bg-white p-6 shadow-xl shadow-amber-950/5 border border-amber-200 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600">
            <LockIcon className="size-7" />
          </div>
          <h2 className="mt-3.5 text-lg font-black text-slate-900">
            Withdrawal Locked
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-slate-600 leading-relaxed max-w-xs mx-auto">
            Withdrawal shuru karne ke liye aapke paas kam se kam <strong className="text-amber-800">ek Paid Solar Plan</strong> hona anivarya hai (₹300 ya usse bada).
          </p>
          <div className="mt-4 rounded-2xl bg-amber-50/80 p-3.5 text-xs font-bold text-amber-950 border border-amber-200 text-left flex items-start gap-2.5">
            <ShieldCheckIcon className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
            <span>Paid plan activate hote hi aapka direct Bank Account withdrawal turant unlock ho jayega!</span>
          </div>
          <Link
            href="/plans"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
          >
            <span>Browse Solar Plans (Starting ₹300)</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : (
        /* ── WITHDRAW FORM ─────────────────────────────────────────── */
        <form onSubmit={handleSubmit} className="relative -mt-6 mx-1 rounded-[26px] bg-white p-5 shadow-xl shadow-amber-950/5 border border-amber-100/80">
          
          <h2 className="text-sm font-black text-slate-900">
            Enter Withdrawal Amount
          </h2>

          {/* Quick preset amount pills */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[200, 500, 1000, available].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setAmount(String(Math.min(v, available)))
                  setError("")
                }}
                className={cn(
                  "rounded-2xl py-2 px-1 text-center transition-all cursor-pointer border text-xs font-extrabold",
                  amount === String(Math.min(v, available))
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm"
                    : "bg-amber-50/40 text-slate-700 border-amber-200/70 hover:bg-amber-50"
                )}
              >
                {v === available ? "All (Max)" : `₹${v}`}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className={cn(
            "mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 border px-3.5 py-2.5 transition-colors",
            amt > 0 && (amt < WITHDRAW_MIN || amt > available) ? "border-red-400 bg-red-50/20" : "border-slate-200"
          )}>
            <span className="text-base font-black text-slate-500">₹</span>
            <input
              type="number"
              min={WITHDRAW_MIN}
              max={available}
              value={amount}
              onChange={(e) => {
                const val = e.target.value
                setAmount(val)
                const num = parseInt(val, 10)
                if (!val) {
                  setError("")
                } else if (isNaN(num) || num < WITHDRAW_MIN) {
                  setError(`Minimum withdrawal amount is ₹${WITHDRAW_MIN}`)
                } else if (num > available) {
                  setError(`Amount exceeds your balance (₹${fmt(available)})`)
                } else {
                  setError("")
                }
              }}
              placeholder={`Min. ₹${WITHDRAW_MIN}`}
              className="flex-1 bg-transparent text-sm font-black text-slate-900 outline-none"
            />
          </div>
          {amt > 0 && amt < WITHDRAW_MIN && (
            <p className="mt-1 text-[11px] font-bold text-red-500">
              ⚠️ Minimum withdrawal amount is ₹{WITHDRAW_MIN} (You entered ₹{amt})
            </p>
          )}
          {amt > available && (
            <p className="mt-1 text-[11px] font-bold text-red-500">
              ⚠️ Cannot withdraw more than balance (₹{fmt(available)})
            </p>
          )}

          {/* Channel Header - Bank Only */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-black text-slate-900">
              Payout Channel
            </p>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Bank Transfer Only
            </span>
          </div>

          {/* Dedicated Bank Channel Card */}
          <div className="mt-2 rounded-2xl bg-amber-50/60 border border-amber-300/80 p-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-300 text-amber-700 shrink-0">
              <Building2Icon className="size-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Direct Bank Account Transfer</p>
              <p className="text-[10px] font-medium text-slate-500">IMPS / NEFT 24×7 Instant Payout to Any Indian Bank</p>
            </div>
          </div>

          {/* Account Details Input */}
          <div className="mt-3.5 flex flex-col gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Account Holder Full Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Ramesh Kumar Sharma"
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Bank Name (Optional)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC Bank"
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter complete bank account number"
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Confirm Bank Account Number
              </label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Re-enter bank account number to confirm"
                className={cn(
                  "w-full rounded-2xl bg-slate-50 border px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none font-mono focus:border-amber-500",
                  confirmAccountNumber && confirmAccountNumber !== accountNumber
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-200"
                )}
              />
              {confirmAccountNumber && confirmAccountNumber !== accountNumber && (
                <p className="mt-1 text-[10px] font-bold text-red-500">
                  Account numbers do not match
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Bank IFSC Code
              </label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="11-digit IFSC code (e.g. SBIN0001234)"
                maxLength={11}
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none font-mono uppercase focus:border-amber-500"
              />
            </div>
          </div>

          {/* Calculation summary */}
          {amt > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50/50 p-3.5 border border-amber-200/70 text-xs">
              <div className="flex justify-between text-slate-600 py-0.5">
                <span>Withdrawal Amount:</span>
                <span className="font-bold text-slate-900">₹{fmt(amt)}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-0.5">
                <span>Fee ({WITHDRAW_FEE_PCT}%):</span>
                <span className="font-semibold text-slate-700">-₹{fmt(fee)}</span>
              </div>
              <div className="flex justify-between pt-1 mt-1 border-t border-amber-200 text-slate-900 font-bold">
                <span>Actual Credit to Bank:</span>
                <span className="text-emerald-600 text-sm font-black">₹{fmt(netPayout)}</span>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 font-semibold">{error}</p>
          )}

          {/* Confirm Button */}
          <Button
            type="submit"
            variant="buy"
            size="xl"
            disabled={!isFormValid || loading}
            className={cn(
              "mt-4 w-full rounded-full py-3.5 font-black transition-all",
              !isFormValid || loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-none"
                : "bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            )}
          >
            {loading
              ? "Processing Bank Request..."
              : !hasPaidPlan
              ? "Paid Plan Required"
              : !today
              ? "Withdrawals Closed on Weekends"
              : available < WITHDRAW_MIN
              ? `Balance below ₹${WITHDRAW_MIN}`
              : !amt || amt < WITHDRAW_MIN
              ? `Enter Min. ₹${WITHDRAW_MIN}`
              : amt > available
              ? "Amount Exceeds Balance"
              : !accountName.trim()
              ? "Enter Account Holder Name"
              : !accountNumber.trim()
              ? "Enter Bank Account Number"
              : accountNumber !== confirmAccountNumber
              ? "Account Numbers Don't Match"
              : !ifsc.trim()
              ? "Enter Bank IFSC Code"
              : `Confirm Bank Transfer (₹${fmt(amt)})`}
          </Button>
        </form>
      )}

      {/* ── LIVE RECENT PAYOUTS (Social Proof with Live Rotating Updates) ── */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Live Recent Payouts
            </h2>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Direct Bank 24×7
          </span>
        </div>

        <div className="rounded-[26px] bg-white shadow-sm border border-amber-100 divide-y divide-amber-100/70 overflow-hidden">
          {payouts.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className={cn(
                "flex items-center justify-between p-3.5 transition-all duration-500",
                pulseIdx === idx ? "bg-emerald-50/70" : "hover:bg-amber-50/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative size-10 rounded-full overflow-hidden border-2 border-amber-300 shadow-xs shrink-0 ring-1 ring-amber-400/40">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {item.method} · {item.time}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-black text-emerald-600">
                  +₹{fmt(item.amount)}
                </p>
                <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  Transferred
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
