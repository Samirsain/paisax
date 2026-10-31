"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth"
import {
  initOneSignal,
  tagOneSignalUser,
  setupClaimReminders,
} from "@/lib/notifications"
import { active, getPlan } from "@/lib/game"

import { toast } from "sonner"
import { NotificationPermissionModal } from "@/components/notification-permission-modal"

interface BroadcastItem {
  id: string
  title: string
  message: string
  url?: string
  createdAt: string
}

/**
 * Global provider component that:
 * 1. Initializes OneSignal SDK on mount (with bell icon disabled)
 * 2. Tags the current user with their ID & phone
 * 3. Sets up periodic claim reminders for active plans
 * 4. Displays the custom Notification Permission Popup modal
 * 5. Receives and displays live admin broadcast notifications in real time
 */
export function NotificationProvider() {
  const { user } = useAuth()

  // Initialize OneSignal on first mount
  useEffect(() => {
    initOneSignal()
  }, [])

  // Tag user when authenticated
  useEffect(() => {
    if (user?.id) {
      tagOneSignalUser(user.id, user.phone)
    }
  }, [user?.id, user?.phone])

  // Setup claim reminders based on active plans from localStorage
  useEffect(() => {
    setupClaimReminders(() => {
      try {
        const KEY = "paisax:v1"
        const raw = localStorage.getItem(KEY)
        if (!raw) return null
        const state = JSON.parse(raw)
        if (!state || !Array.isArray(state.owned)) return null
        const activePlans = active(state)
        if (activePlans.length === 0) return null
        const dailyEarning = activePlans.reduce((sum, o) => sum + getPlan(o.planId).perDay, 0)
        return { count: activePlans.length, dailyEarning }
      } catch {
        return null
      }
    })
  }, [])

  // Listen for admin broadcasts in real-time (ideal for localhost & production delivery)
  useEffect(() => {
    async function checkLatestBroadcasts() {
      if (typeof window === "undefined") return
      try {
        const res = await fetch("/api/notifications/latest")
        if (!res.ok) return
        const data = await res.json()
        const items: BroadcastItem[] = data.notifications || []
        if (items.length === 0) return

        const lastSeen = localStorage.getItem("paisax_last_seen_notif_time")
        // Default to 10 seconds ago on first visit so initial load doesn't replay old history
        const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : Date.now() - 15_000

        const newItems = items.filter((n) => new Date(n.createdAt).getTime() > lastSeenTime)

        if (newItems.length > 0) {
          localStorage.setItem("paisax_last_seen_notif_time", items[0].createdAt)

          newItems.reverse().forEach((n) => {
            // 1. Native browser push notification (if granted)
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                const notif = new Notification(n.title, {
                  body: n.message,
                  icon: "/icon-192.png",
                  badge: "/icon-192.png",
                  tag: `broadcast-${n.id}`,
                })
                if (n.url) {
                  notif.onclick = () => {
                    window.focus()
                    window.location.href = n.url!
                  }
                }
              } catch {
                navigator.serviceWorker?.ready.then((reg) => {
                  reg.showNotification(n.title, {
                    body: n.message,
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                    tag: `broadcast-${n.id}`,
                    data: { url: n.url },
                  })
                }).catch(() => {})
              }
            }

            // 2. In-app Sonner alert banner
            toast.info(n.title, {
              description: n.message,
              duration: 7000,
              action: n.url ? {
                label: "Open",
                onClick: () => {
                  window.location.href = n.url!
                },
              } : undefined,
            })
          })
        }
      } catch {
        // Silently ignore
      }
    }

    const timer = setTimeout(checkLatestBroadcasts, 2500)
    const interval = setInterval(checkLatestBroadcasts, 15_000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return <NotificationPermissionModal />
}
