"use client"

import { useState, useEffect } from "react"
import { BellRing, CheckCircle2Icon, Loader2, XIcon } from "lucide-react"
import { requestNotificationPermission, notifyPermissionGranted } from "@/lib/notifications"

interface NotificationPermissionModalProps {
  forceOpen?: boolean
  onClose?: () => void
}

/**
 * Minimal top dropdown notification banner for push notification permission.
 * Slides down smoothly like a native phone notification dropdown.
 */
export function NotificationPermissionModal({ forceOpen, onClose }: NotificationPermissionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [granted, setGranted] = useState(false)

  const open = forceOpen !== undefined ? forceOpen : internalOpen

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined" || !("Notification" in window)) {
      return
    }

    // If permission already granted or denied, don't show prompt
    if (Notification.permission !== "default") {
      return
    }

    // Check 24-hour dismissal cooldown
    try {
      const dismissedAt = localStorage.getItem("paisax_notif_prompt_dismissed_at")
      if (dismissedAt) {
        const passed = Date.now() - parseInt(dismissedAt, 10)
        if (passed < 24 * 60 * 60 * 1000) {
          return
        }
      }
    } catch {}

    // Delay slightly so it slides down like a native dropdown after page loads
    const welcomeShown = sessionStorage.getItem("solar_welcome_shown")
    const delay = !welcomeShown ? 4000 : 1800

    const timer = setTimeout(() => {
      if (Notification.permission === "default") {
        setInternalOpen(true)
      }
    }, delay)

    // Global manual trigger listener
    const handleManualOpen = () => {
      setGranted(false)
      setInternalOpen(true)
    }
    window.addEventListener("paisax_open_notification_prompt", handleManualOpen)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("paisax_open_notification_prompt", handleManualOpen)
    }
  }, [])

  const handleDismiss = () => {
    setInternalOpen(false)
    try {
      localStorage.setItem("paisax_notif_prompt_dismissed_at", Date.now().toString())
    } catch {}
    onClose?.()
  }

  const handleAllow = async () => {
    setRequesting(true)
    try {
      const result = await requestNotificationPermission()
      if (result === "granted") {
        setGranted(true)
        notifyPermissionGranted()
        setTimeout(() => {
          setInternalOpen(false)
          onClose?.()
        }, 1100)
      } else {
        handleDismiss()
      }
    } catch {
      handleDismiss()
    } finally {
      setRequesting(false)
    }
  }

  if (!open) return null

  return (
    <aside aria-label="Notification permission alert" className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:top-4 z-50 max-w-sm sm:w-96 mx-auto sm:mx-0 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-[#0c121e]/95 border border-amber-500/35 p-2.5 sm:p-3 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-xl text-white">
        
        {/* Subtle golden ambient glow */}
        <div className="absolute -top-8 -right-8 size-24 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />

        {granted ? (
          /* Success state inline */
          <div className="flex items-center gap-2.5 py-1 px-1 text-left animate-in zoom-in-95 duration-200">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2Icon className="size-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">Notifications Enabled!</p>
              <p className="text-[10px] text-emerald-400 truncate">You will receive instant daily earnings alerts</p>
            </div>
          </div>
        ) : (
          /* Dropdown notification layout */
          <div className="flex items-center gap-2.5">
            {/* Left: Animated Bell Icon with Green Active Dot */}
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-400">
              <BellRing className="size-4.5 animate-bounce duration-1000" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 border border-[#0c121e]" />
              </span>
            </div>

            {/* Middle: Short punchy text */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight truncate">
                  Allow Notifications
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-extrabold text-amber-300 shrink-0">
                  Daily Alerts
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
                Get instant daily returns & payout alerts
              </p>
            </div>

            {/* Right: Allow button & Close X */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAllow}
                disabled={requesting}
                className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm shadow-amber-500/30 hover:opacity-95 active:scale-95 disabled:opacity-75 transition-all cursor-pointer"
              >
                {requesting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span>Allow</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
