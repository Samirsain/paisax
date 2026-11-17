"use client"

import { useState, useEffect } from "react"
import { CheckCircle2Icon, ShieldCheckIcon, ClockIcon, Building2Icon, ArrowRightIcon } from "lucide-react"
import Link from "next/link"
import { fmt } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  name: string
  amount: number
  status: string
  time: string
  method: string
  isDemo: boolean
}

export function RecentWithdrawalActivity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "real">("all")

  useEffect(() => {
    fetch("/api/wallet/withdraw/activity")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.items)) {
          setItems(data.items)
        }
      })
      .catch((err) => {
        console.warn("Failed to load withdrawal activity:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = items.filter((item) => {
    if (filter === "real") return !item.isDemo
    return true
  })

  return (
    <div className="flex flex-col gap-2.5 mt-2">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span>Recent Withdrawal Activity</span>
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
            <ShieldCheckIcon className="size-3 text-amber-700" />
            <span>Bank Verified</span>
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-[26px] bg-white shadow-sm border border-amber-100/90 overflow-hidden">
        
        {/* Info Banner */}
        <div className="bg-amber-50/60 px-4 py-2 border-b border-amber-100/70 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Building2Icon className="size-3.5 text-amber-600" />
            <span>Direct IMPS/NEFT Transfers</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            500+ Record Capacity • Privacy Masked
          </span>
        </div>

        {/* List of Transactions */}
        <div className="divide-y divide-amber-100/60 max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Loading recent payouts…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No recent withdrawals recorded yet
            </div>
          ) : (
            filteredItems.slice(0, 50).map((tx, idx) => (
              <div
                key={`${tx.id}-${idx}`}
                className="flex items-center justify-between p-3 px-4 hover:bg-amber-50/30 transition-colors"
              >
                {/* Left: Avatar + Masked Name + Method + Time */}
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300 text-amber-800 font-black text-xs shrink-0 shadow-xs">
                    {tx.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">{tx.name}</p>
                      {tx.isDemo ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-500 border border-slate-200">
                          DEMO
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-700 border border-emerald-200">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {tx.id.length > 14 ? tx.id.slice(0, 14) + "…" : tx.id} • {tx.method} • {tx.time}
                    </p>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600 font-mono">
                    +₹{fmt(tx.amount)}
                  </p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2Icon className="size-2.5 text-emerald-600" />
                    <span>{tx.status}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer link to withdrawal page */}
        <div className="bg-slate-50/80 p-3 border-t border-amber-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-500">
            Got earnings in your wallet?
          </span>
          <Link
            href="/wallet/withdraw"
            className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 hover:text-amber-800 active:scale-95 transition-all"
          >
            <span>Request Bank Payout</span>
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
