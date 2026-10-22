"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ClipboardCheckIcon, HouseIcon, Loader2Icon, ZapIcon } from "lucide-react"
import { CoinBurst } from "@/components/coin-lottie"
import { PlanIcon } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cantBuy, getPlan, type PlanId } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"

/** Confirm, then redirect to AeroPay payment gateway. */
export function BuySheet({ planId, onClose }: { planId: PlanId | null; onClose: () => void }) {
  const { state } = useStore()
  const router = useRouter()
  const [shown, setShown] = useState(planId)
  const [done, setDone] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")
  const [testMode, setTestMode] = useState(false)

  if (planId && planId !== shown) {
    setShown(planId)
    setDone(false)
    setPayError("")
    setTestMode(false)
  }
  if (!shown) return null

  const plan = getPlan(shown)
  const why = done ? null : cantBuy(state, shown)
  const go = (href: string) => { onClose(); router.push(href) }

  async function handlePay() {
    setPaying(true)
    setPayError("")
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: shown }),
      })
      const data = await res.json()
      if (!res.ok || !data.paymentUrl) {
        setPayError(data.error ?? "Payment gateway unavailable. Please try again.")
        setPaying(false)
        return
      }
      if (data.testMode) setTestMode(true)
      window.location.href = data.paymentUrl
    } catch {
      setPayError("Network error. Please check your connection and try again.")
      setPaying(false)
    }
  }

  return (
    <Dialog open={planId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent sheet showCloseButton={false}>
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <div className="relative" aria-hidden>
                <CoinBurst size={160} />
              </div>
              <DialogTitle className="text-headline-lg text-on-surface">{plan.name} Plan is live!</DialogTitle>
              <DialogDescription className="text-body-lg text-on-variant">
                Your first <span className="font-semibold text-claim">₹{plan.perDay}</span> earning is ready to claim.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-surface-low p-3">
              <PlanIcon planId={plan.id} className="size-10" />
              <div className="flex-1">
                <p className="text-label-lg text-on-surface">{plan.name} Plan</p>
                <p className="text-body-sm text-on-variant">Day 0 of {plan.days} · ₹{plan.perDay}/day</p>
              </div>
              <ZapIcon className="size-5 fill-claim text-claim" aria-hidden />
            </div>
            <div className="grid gap-2">
              <Button variant="buy" size="xl" onClick={() => go("/my-plans")}>
                <ClipboardCheckIcon aria-hidden /> Track in My Plans
              </Button>
              <Button variant="soft" size="lg" onClick={() => go("/")}>
                <HouseIcon aria-hidden /> Go to Home
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex-row items-center gap-3">
              <PlanIcon planId={plan.id} />
              <div>
                <DialogTitle className="text-headline-sm text-on-surface">Subscribe to {plan.name} Plan?</DialogTitle>
                <DialogDescription className="text-body-md text-on-variant">
                  ₹{plan.perDay} daily for {plan.days} days
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* Order summary */}
            <div className="rounded-xl bg-surface-low p-4">
              <p className="text-label-lg text-on-surface">Order summary</p>
              <dl className="mt-3 flex flex-col gap-2 text-body-md">
                <div className="flex justify-between">
                  <dt className="text-on-variant">{plan.name} Plan ({plan.days} days)</dt>
                  <dd className="text-on-surface">₹{fmt(plan.cost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-variant">Daily earning</dt>
                  <dd className="font-semibold text-claim">₹{plan.perDay}/day</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-variant">Net profit (30 days)</dt>
                  <dd className="font-semibold text-claim">₹{(plan.perDay * plan.days - plan.cost).toLocaleString("en-IN")}</dd>
                </div>
              </dl>
            </div>

            {/* Gateway badge */}
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700 ring-1 ring-blue-100">
              <span>🔒</span>
              <span>Secure payment via <strong>AeroPay</strong> gateway</span>
            </div>

            {why ? (
              <p role="alert" className="text-body-md text-on-variant">
                {why === "running"
                  ? `${plan.name} is already running.`
                  : `You need ₹${fmt(plan.cost - state.coins)} more to subscribe.`}
              </p>
            ) : (
              <p className="text-body-sm text-on-variant">
                You will be redirected to a secure payment page. Start earning ₹{plan.perDay}/day once payment is confirmed.
              </p>
            )}

            {payError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                {payError}
              </p>
            )}

            <div className="grid gap-2">
              {!why && (
                <Button variant="buy" size="xl" disabled={paying} onClick={handlePay}>
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <Loader2Icon className="size-4 animate-spin" />
                      Redirecting to payment…
                    </span>
                  ) : (
                    `Pay ₹${fmt(plan.cost)} via AeroPay`
                  )}
                </Button>
              )}
              <Button variant="ghost" size="lg" onClick={onClose} disabled={paying}>
                {why ? "Close" : "Not now"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
