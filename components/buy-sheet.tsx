"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { CheckCircle2Icon, ClipboardCheckIcon, HouseIcon, Loader2Icon, ShieldCheckIcon, SparklesIcon, WalletIcon, ZapIcon } from "lucide-react"
import { CoinBurst } from "@/components/coin-lottie"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getPlan, type PlanId } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"

/** Confirm, then redirect to AeroPay payment gateway or activate directly. */
export function BuySheet({ planId, onClose }: { planId: PlanId | null; onClose: () => void }) {
  const { state, buy, activatePlan } = useStore()
  const router = useRouter()
  const [shown, setShown] = useState(planId)
  const [done, setDone] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")

  if (planId && planId !== shown) {
    setShown(planId)
    setDone(false)
    setPayError("")
  }
  if (!shown) return null

  const plan = getPlan(shown)
  const alreadyHasFree = shown === "free" && state.owned.some((o) => o.planId === "free")
  const hasCoins = state.coins >= plan.cost && plan.cost > 0
  const go = (href: string) => { onClose(); router.push(href) }

  // Direct activation (e.g. Free plan, or instant activation)
  function handleDirectActivate() {
    if (alreadyHasFree) {
      setPayError("Free plan can only be claimed once per user.")
      return
    }
    try {
      activatePlan(shown!)
      setDone(true)
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to activate plan")
    }
  }

  // Pay with wallet coins
  function handlePayWithWallet() {
    try {
      buy(shown!)
      setDone(true)
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Insufficient balance")
    }
  }

  // AeroPay payment gateway
  async function handlePayGateway() {
    setPaying(true)
    setPayError("")

    if (plan.cost === 0) {
      handleDirectActivate()
      setPaying(false)
      return
    }

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: shown }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setPayError("Please login to proceed with payment.")
        setPaying(false)
        router.push("/login")
        return
      }

      if (!res.ok || !data.paymentUrl) {
        setPayError(data.error ?? "Failed to initiate payment. Please try again.")
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
    <Dialog open={planId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent sheet showCloseButton={false} className="border border-amber-100 rounded-t-[32px] sm:rounded-[32px] shadow-2xl">
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <div className="relative" aria-hidden>
                <CoinBurst size={160} />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900">
                {plan.name} is Live!
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-600">
                Your first <span className="font-bold text-emerald-600">₹{fmt(plan.perDay)}</span> daily return is ready to earn.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-amber-50/50 p-3.5 border border-amber-200/70">
              <div className="relative size-12 rounded-xl overflow-hidden shrink-0 border border-amber-200">
                <Image
                  src={plan.image || "/dairymilk/product.png"}
                  alt={plan.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{plan.name}</p>
                <p className="text-xs text-slate-500">₹{fmt(plan.perDay)}/day · {plan.days} days duration</p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ZapIcon className="size-4.5 fill-emerald-600 text-emerald-600" />
              </span>
            </div>

            <div className="grid gap-2.5 mt-2">
              <Button
                variant="buy"
                size="xl"
                onClick={() => go("/my-plans")}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-full shadow-lg shadow-amber-500/25"
              >
                <ClipboardCheckIcon className="size-5" /> View in My Plans
              </Button>
              <Button
                variant="soft"
                size="lg"
                onClick={() => go("/")}
                className="rounded-full bg-amber-100/70 text-amber-900 font-bold hover:bg-amber-200/70"
              >
                <HouseIcon className="size-4.5" /> Back to Home
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex-row items-center gap-3.5 text-left pb-1">
              <div className="relative size-14 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-200 shadow-sm bg-amber-50">
                <Image
                  src={plan.image || "/dairymilk/product.png"}
                  alt={plan.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900">
                  {plan.name}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500">
                  ₹{fmt(plan.perDay)} daily return · {plan.days} days
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Order summary card */}
            <div className="rounded-2xl bg-[#fffdf9] p-4 border border-amber-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Plan Details
              </p>
              <dl className="mt-2.5 flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-slate-600">Investment Amount</dt>
                  <dd className="text-base font-black text-slate-900">₹{fmt(plan.cost)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-600">Daily Return</dt>
                  <dd className="font-bold text-emerald-600">₹{fmt(plan.perDay)} / day</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-slate-600">Duration</dt>
                  <dd className="font-semibold text-slate-900">{plan.days} days</dd>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-100">
                  <dt className="font-bold text-slate-900">Total Return</dt>
                  <dd className="font-black text-base text-amber-600">
                    ₹{fmt(plan.perDay * plan.days)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Gateway notice */}
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs text-amber-900 border border-amber-200">
              <ShieldCheckIcon className="size-4 shrink-0 text-amber-600" />
              <span>Instant activation & secure payment via <strong>AeroPay UPI</strong></span>
            </div>

            {payError && (
              <p role="alert" className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                {payError}
              </p>
            )}

            {/* Purchase CTA Buttons - ALWAYS ACTIVE */}
            <div className="grid gap-2.5 pt-1">
              
              {/* Primary AeroPay Payment Button */}
              {plan.cost > 0 && (
                <Button
                  variant="buy"
                  size="xl"
                  disabled={paying}
                  onClick={handlePayGateway}
                  className="w-full rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-3.5 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-[0.99] cursor-pointer"
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <Loader2Icon className="size-4.5 animate-spin" />
                      Redirecting to Payment…
                    </span>
                  ) : (
                    <span>Pay ₹{fmt(plan.cost)} via UPI / AeroPay</span>
                  )}
                </Button>
              )}

              {/* Pay with wallet coins if available */}
              {hasCoins && (
                <Button
                  variant="soft"
                  size="lg"
                  disabled={paying}
                  onClick={handlePayWithWallet}
                  className="w-full rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100"
                >
                  <WalletIcon className="size-4 text-emerald-700" />
                  Pay with Coin Balance (₹{fmt(plan.cost)})
                </Button>
              )}

              {/* Free plan direct activate (only when cost is 0) */}
              {plan.cost === 0 && (
                alreadyHasFree ? (
                  <div className="flex flex-col items-center gap-1 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-center">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <CheckCircle2Icon className="size-4 text-emerald-600" /> Free Plan Already Active (Limit 1/1)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      You can receive daily return in My Plans tab
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="buy"
                    size="xl"
                    disabled={paying}
                    onClick={handleDirectActivate}
                    className="w-full rounded-full bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#d97706] py-3.5 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-[0.99] cursor-pointer"
                  >
                    <SparklesIcon className="size-4.5 text-slate-950" />
                    Activate Free Plan
                  </Button>
                )
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={paying}
                className="text-slate-500 hover:text-slate-800"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
