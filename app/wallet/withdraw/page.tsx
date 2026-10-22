"use client"

import Image from "next/image"
import { useState } from "react"
import { AlertCircleIcon, BanknoteIcon, CheckCircle2Icon, ClockIcon, InfoIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react"
import { Skeleton } from "@/components/marks"
import { useStore } from "@/lib/store"
import { canWithdrawToday, WITHDRAW_FEE_PCT, WITHDRAW_MIN } from "@/lib/game"
import { cn } from "@/lib/utils"

const METHODS = [
  { id: "upi", label: "UPI", icon: "₹", placeholder: "yourname@upi" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", placeholder: "Account number" },
  { id: "paytm", label: "Paytm", icon: "P", placeholder: "Paytm mobile number" },
]

// Recent withdrawals for social proof — with dicebear seeds for avatars
const RECENT = [
  { name: "Priya S.", amount: 1170, plan: "Jio Plan", time: "2h ago", seed: "priya" },
  { name: "Rahul V.", amount: 2970, plan: "Tata Plan", time: "5h ago", seed: "rahul" },
  { name: "Ananya K.", amount: 660, plan: "Airtel Plan", time: "9h ago", seed: "ananya" },
  { name: "Arjun P.", amount: 390, plan: "Jio Plan", time: "14h ago", seed: "arjun" },
]

export default function WithdrawPage() {
  const { ready: loaded, state } = useStore()
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("upi")
  const [address, setAddress] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "success">("form")
  const [error, setError] = useState("")

  if (!loaded) return <Skeleton />

  const today = canWithdrawToday()
  const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" })
  const coins = state.coins
  const available = Math.max(0, coins)
  const amt = parseInt(amount) || 0
  const fee = Math.round(amt * WITHDRAW_FEE_PCT / 100)
  const payout = amt - fee

  function validate() {
    if (!today) { setError(`Withdrawals not available on ${dayName}`); return false }
    if (amt < WITHDRAW_MIN) { setError(`Minimum withdrawal is ₹${WITHDRAW_MIN}`); return false }
    if (amt > available) { setError("Amount exceeds your coin balance"); return false }
    if (!address.trim()) { setError("Enter your payment address"); return false }
    setError("")
    return true
  }

  const selectedMethod = METHODS.find(m => m.id === method)!

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="sr-only">Withdraw</h1>

      {/* ── Balance card (gradient, self-contained dark) ── */}
      <section className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#1e1a9e,#2f2fbd)" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="flex items-center gap-2 text-sm font-semibold opacity-80">
            <BanknoteIcon className="size-4" /> Available Balance
          </p>
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Coins
          </span>
        </div>
        <p className="text-[42px] font-bold leading-none tracking-tight mt-2">₹{available.toLocaleString("en-IN")}</p>
        <p className="text-xs mt-1.5 opacity-65">Min. ₹{WITHDRAW_MIN} · {WITHDRAW_FEE_PCT}% processing fee · Mon–Fri only</p>

        {/* Quick amounts */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[200, 500, 1000, available].map((v) => (
            <button key={v} type="button"
              onClick={() => setAmount(String(Math.min(v, available)))}
              className={cn("rounded-xl py-2 text-sm font-bold transition-all active:scale-95",
                amt === v ? "bg-white text-[#1e1a9e]" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {v === available ? "All" : `₹${v}`}
            </button>
          ))}
        </div>
      </section>

      {/* ── Weekend warning ── */}
      {!today && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
          <XCircleIcon className="size-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700">Withdrawals Closed Today</p>
            <p className="text-xs text-red-500 mt-0.5">
              No withdrawals on Saturday & Sunday. Please come back on Monday.
            </p>
          </div>
        </div>
      )}

      {step === "success" ? (
        /* ── Success ── */
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
          <CheckCircle2Icon className="size-16 text-emerald-500" />
          <div>
            <p className="text-xl font-bold text-on-surface">Request Submitted!</p>
            <p className="text-sm text-on-variant mt-1">
              ₹{payout.toLocaleString("en-IN")} will be credited to your {selectedMethod.label} within 24–48 hours.
            </p>
          </div>
          <div className="w-full rounded-xl bg-white p-3.5 ring-1 ring-border text-left">
            <div className="flex justify-between text-sm">
              <span className="text-on-variant">Requested</span>
              <span className="text-on-surface font-semibold">₹{amt.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-on-variant">Fee ({WITHDRAW_FEE_PCT}%)</span>
              <span className="text-red-600 font-semibold">−₹{fee}</span>
            </div>
            <div className="flex justify-between text-sm mt-1.5 pt-1.5 border-t border-border">
              <span className="text-on-surface font-bold">You receive</span>
              <span className="font-bold text-claim">₹{payout.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <button onClick={() => { setStep("form"); setAmount(""); setAddress("") }}
            className="w-full rounded-full py-3 text-sm font-bold text-primary ring-1 ring-primary/20 hover:bg-primary-fixed transition-colors">
            Make Another Withdrawal
          </button>
        </div>
      ) : step === "confirm" ? (
        /* ── Confirm ── */
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-border shadow-card">
          <p className="text-base font-bold text-on-surface">Confirm Withdrawal</p>

          <div className="flex flex-col gap-2 rounded-xl bg-surface-low p-4">
            {[
              ["Amount", `₹${amt.toLocaleString("en-IN")}`],
              ["Processing fee", `−₹${fee} (${WITHDRAW_FEE_PCT}%)`],
              ["You receive", `₹${payout.toLocaleString("en-IN")}`],
              ["Method", selectedMethod.label],
              ["To", address],
              ["Est. time", "24–48 business hours"],
            ].map(([k, v]) => (
              <div key={k} className={cn("flex justify-between text-sm", k === "You receive" && "pt-2 border-t border-border")}>
                <span className="text-on-variant">{k}</span>
                <span className={cn("font-semibold", k === "You receive" ? "text-claim font-bold" : k === "Processing fee" ? "text-red-600" : "text-on-surface")}>{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs ring-1 ring-amber-200">
            <InfoIcon className="size-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-amber-700">Once submitted, withdrawal requests cannot be cancelled. Funds are transferred after manual verification.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("form")}
              className="flex-1 rounded-full py-3 text-sm font-bold ring-1 ring-border text-on-variant hover:bg-surface-low transition-colors">
              Go Back
            </button>
            <button onClick={() => setStep("success")}
              className="flex-1 rounded-full py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#006c49,#4edea3)", boxShadow: "0 6px 20px #4edea330" }}>
              Confirm ₹{payout.toLocaleString("en-IN")}
            </button>
          </div>
        </div>
      ) : (
        /* ── Form ── */
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-border shadow-card">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-variant">Withdrawal Amount (₹)</label>
            <div className="flex items-center gap-2 rounded-xl bg-surface-low px-4 py-3.5 ring-1 ring-border text-lg">
              <span className="font-bold text-on-variant">₹</span>
              <input type="number" inputMode="numeric" placeholder="Enter amount" min={WITHDRAW_MIN} max={available}
                value={amount} onChange={(e) => { setAmount(e.target.value); setError("") }}
                className="w-full bg-transparent font-bold text-on-surface placeholder:text-on-variant/40 outline-none" />
            </div>
            {amt > 0 && (
              <p className="text-xs text-amber-700">
                Fee: ₹{fee} · You receive: <span className="font-bold text-claim">₹{payout}</span>
              </p>
            )}
          </div>

          {/* Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-variant">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(m => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  className={cn("flex flex-col items-center gap-1 rounded-xl py-3 text-sm font-bold transition-all ring-1",
                    method === m.id
                      ? "bg-primary-fixed text-primary ring-primary/30"
                      : "bg-surface-low text-on-variant ring-border hover:bg-surface-mid"
                  )}>
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-variant">
              {selectedMethod.id === "bank" ? "Account Number" : selectedMethod.id === "paytm" ? "Paytm Number" : "UPI ID"}
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-surface-low px-3.5 py-3 ring-1 ring-border">
              <span className="text-on-variant/50 text-sm">@</span>
              <input type="text" placeholder={selectedMethod.placeholder}
                value={address} onChange={(e) => { setAddress(e.target.value); setError("") }}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-variant/40 outline-none" />
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface-low p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-3.5 shrink-0 text-claim" />
              <span className="text-on-variant">Min. ₹{WITHDRAW_MIN} · Max. ₹{available.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="size-3.5 shrink-0 text-amber" />
              <span className="text-on-variant">Mon–Fri only. No weekends.</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="size-3.5 shrink-0 text-primary" />
              <span className="text-on-variant">{WITHDRAW_FEE_PCT}% processing fee deducted automatically</span>
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircleIcon className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <button type="button" disabled={!today}
            onClick={() => { if (validate()) setStep("confirm") }}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#006c49,#00714d)", boxShadow: "0 8px 24px #4edea330" }}>
            <BanknoteIcon className="size-4" />
            {today ? "Request Withdrawal" : `Unavailable on ${dayName}`}
          </button>
        </div>
      )}

      {/* ── Recent withdrawals with avatars ── */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-variant mb-3">Recent Member Withdrawals</p>
        <div className="flex flex-col gap-2">
          {RECENT.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-border shadow-card">
              <div className="flex items-center gap-2.5">
                <Image
                  src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${r.seed}&radius=50`}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                  className="size-9 shrink-0 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-on-surface">{r.name}</p>
                  <p className="text-xs text-on-variant">{r.plan} · {r.time}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-claim">+₹{r.amount.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
