"use client"

import { useState } from "react"
import { AlertCircleIcon, BanknoteIcon, CheckCircle2Icon, ClockIcon, InfoIcon, PhoneIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react"
import { Skeleton } from "@/components/marks"
import { useStore } from "@/lib/store"
import { canWithdrawToday, WITHDRAW_FEE_PCT, WITHDRAW_MIN } from "@/lib/game"
import { cn } from "@/lib/utils"

const METHODS = [
  { id: "upi", label: "UPI", icon: "₹", placeholder: "yourname@upi" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", placeholder: "Account number" },
  { id: "paytm", label: "Paytm", icon: "P", placeholder: "Paytm mobile number" },
]

// Fake recent withdrawals for social proof
const RECENT = [
  { name: "Priya S.", amount: 1170, plan: "Jio Plan", time: "2h ago" },
  { name: "Rahul V.", amount: 2970, plan: "Tata Plan", time: "5h ago" },
  { name: "Ananya K.", amount: 660, plan: "Airtel Plan", time: "9h ago" },
  { name: "Arjun P.", amount: 390, plan: "Jio Plan", time: "14h ago" },
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
  // Treat 1 coin = ₹1 for display; actual payout requires admin approval
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

      {/* Balance card */}
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

      {/* Weekend warning */}
      {!today && (
        <div className="flex items-start gap-2.5 rounded-2xl p-4 ring-1" style={{ background: "#ba1a1a12", borderColor: "#ff544935" }}>
          <XCircleIcon className="size-5 shrink-0 mt-0.5" style={{ color: "#ff5449" }} />
          <div>
            <p className="text-sm font-bold text-red-300">Withdrawals Closed Today</p>
            <p className="text-xs text-red-300/70 mt-0.5">
              No withdrawals on Saturday & Sunday. Please come back on Monday.
            </p>
          </div>
        </div>
      )}

      {step === "success" ? (
        /* ── Success ── */
        <div className="flex flex-col items-center gap-4 rounded-2xl p-8 text-center ring-1" style={{ background: "#00714d12", borderColor: "#4edea330" }}>
          <CheckCircle2Icon className="size-16" style={{ color: "#4edea3" }} />
          <div>
            <p className="text-xl font-bold text-white">Request Submitted!</p>
            <p className="text-sm text-white/60 mt-1">
              ₹{payout.toLocaleString("en-IN")} will be credited to your {selectedMethod.label} within 24–48 hours.
            </p>
          </div>
          <div className="w-full rounded-xl p-3.5 ring-1 text-left" style={{ background: "#ffffff08", borderColor: "#ffffff15" }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Requested</span>
              <span className="text-white font-semibold">₹{amt.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-white/50">Fee ({WITHDRAW_FEE_PCT}%)</span>
              <span className="text-red-300 font-semibold">−₹{fee}</span>
            </div>
            <div className="flex justify-between text-sm mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-white font-bold">You receive</span>
              <span className="font-bold" style={{ color: "#4edea3" }}>₹{payout.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <button onClick={() => { setStep("form"); setAmount(""); setAddress("") }}
            className="w-full rounded-full py-3 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/10 transition-colors">
            Make Another Withdrawal
          </button>
        </div>
      ) : step === "confirm" ? (
        /* ── Confirm ── */
        <div className="flex flex-col gap-4 rounded-2xl p-5 ring-1" style={{ background: "#ffffff08", borderColor: "#ffffff15" }}>
          <p className="text-base font-bold text-white">Confirm Withdrawal</p>

          <div className="flex flex-col gap-2 rounded-xl p-4 ring-1" style={{ background: "#ffffff08", borderColor: "#ffffff10" }}>
            {[
              ["Amount", `₹${amt.toLocaleString("en-IN")}`],
              ["Processing fee", `−₹${fee} (${WITHDRAW_FEE_PCT}%)`],
              ["You receive", `₹${payout.toLocaleString("en-IN")}`],
              ["Method", selectedMethod.label],
              ["To", address],
              ["Est. time", "24–48 business hours"],
            ].map(([k, v]) => (
              <div key={k} className={cn("flex justify-between text-sm", k === "You receive" && "pt-2 border-t border-white/10")}>
                <span className="text-white/50">{k}</span>
                <span className={cn("font-semibold", k === "You receive" ? "text-emerald-400 font-bold" : k === "Processing fee" ? "text-red-300" : "text-white")}>{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl p-3 text-xs" style={{ background: "#ffb95f12", borderColor: "#ffb95f30" }}>
            <InfoIcon className="size-4 shrink-0 mt-0.5" style={{ color: "#ffb95f" }} />
            <p style={{ color: "#ffddb8" }}>Once submitted, withdrawal requests cannot be cancelled. Funds are transferred after manual verification.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("form")}
              className="flex-1 rounded-full py-3 text-sm font-bold ring-1 ring-white/20 text-white/70 hover:bg-white/10 transition-colors">
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
        <div className="flex flex-col gap-4 rounded-2xl p-5 ring-1" style={{ background: "#ffffff08", borderColor: "#ffffff15" }}>
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Withdrawal Amount (₹)</label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3.5 ring-1 text-lg" style={{ background: "#ffffff10", borderColor: "#ffffff18" }}>
              <span className="font-bold text-white/40">₹</span>
              <input type="number" inputMode="numeric" placeholder="Enter amount" min={WITHDRAW_MIN} max={available}
                value={amount} onChange={(e) => { setAmount(e.target.value); setError("") }}
                className="w-full bg-transparent font-bold text-white placeholder:text-white/25 outline-none" />
            </div>
            {amt > 0 && (
              <p className="text-xs" style={{ color: "#ffb95f" }}>
                Fee: ₹{fee} · You receive: <span className="font-bold text-emerald-400">₹{payout}</span>
              </p>
            )}
          </div>

          {/* Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(m => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  className={cn("flex flex-col items-center gap-1 rounded-xl py-3 text-sm font-bold transition-all ring-1",
                    method === m.id ? "text-white" : "text-white/60 hover:text-white")}
                  style={{
                    background: method === m.id ? "#6063ee30" : "#ffffff08",
                    borderColor: method === m.id ? "#8083ff60" : "#ffffff15"
                  }}>
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              {selectedMethod.id === "bank" ? "Account Number" : selectedMethod.id === "paytm" ? "Paytm Number" : "UPI ID"}
            </label>
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 ring-1" style={{ background: "#ffffff10", borderColor: "#ffffff18" }}>
              <PhoneIcon className="size-4 shrink-0 text-white/35" />
              <input type="text" placeholder={selectedMethod.placeholder}
                value={address} onChange={(e) => { setAddress(e.target.value); setError("") }}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-1.5 rounded-xl p-3.5 text-xs ring-1" style={{ background: "#ffffff06", borderColor: "#ffffff10" }}>
            {[
              [ShieldCheckIcon, "Min. ₹200 · Max. ₹" + available.toLocaleString("en-IN"), "#4edea3"],
              [ClockIcon, "Mon–Fri only. No weekends.", "#ffb95f"],
              [AlertCircleIcon, `${WITHDRAW_FEE_PCT}% processing fee deducted automatically`, "#8083ff"],
            ].map(([Icon, text, color], i) => (
              <div key={i} className="flex items-center gap-2">
                {/* @ts-ignore */}
                <Icon className="size-3.5 shrink-0" style={{ color }} />
                <span style={{ color: (color as string) + "99" }}>{text as string}</span>
              </div>
            ))}
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ring-1" style={{ background: "#ba1a1a18", color: "#ffb4ab", borderColor: "#ff544940" }}>
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

      {/* Recent withdrawals */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-variant mb-3">Recent Member Withdrawals</p>
        <div className="flex flex-col gap-2">
          {RECENT.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl px-4 py-3 ring-1 bg-surface-low">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "#6063ee20", color: "#8083ff" }}>
                  {r.name[0]}
                </span>
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
