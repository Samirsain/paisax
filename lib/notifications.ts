"use client"

/**
 * OneSignal Push Notifications utility for PaisaX.
 * 
 * Features:
 * - Initializes OneSignal SDK with app credentials
 * - Tags user with userId + phone for targeted notifications
 * - Triggers local notifications for wallet credits
 * - Sets up daily plan claim reminders
 */

const ONESIGNAL_APP_ID = "255a95b3-0f4f-44be-b713-ee57303374a1"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>
    OneSignal?: any
  }
}

let initialized = false

/** Load OneSignal SDK script if not already present */
function loadOneSignalScript() {
  if (typeof document === "undefined") return
  if (document.querySelector('script[src*="OneSignalSDK"]')) return
  
  const script = document.createElement("script")
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
  script.defer = true
  document.head.appendChild(script)
}

/** Initialize OneSignal — call once after auth */
export function initOneSignal() {
  if (typeof window === "undefined" || initialized) return
  initialized = true
  
  loadOneSignalScript()
  
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: "web.onesignal.auto.379e9ba9-232a-4433-a939-20e3e6310530",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    })
  })
}

/** Tag the user with their PaisaX user ID and phone for targeted push */
export function tagOneSignalUser(userId: string, phone?: string) {
  if (typeof window === "undefined") return
  
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.login(userId)
      await OneSignal.User.addTags({
        paisax_uid: userId,
        ...(phone ? { phone } : {}),
      })
    } catch {
      // Silently ignore tag errors
    }
  })
}

/**
 * Show a local browser notification for wallet credit events.
 * Falls back to OneSignal's notification display if available.
 */
export function notifyWalletCredit(amount: number, reason: string) {
  if (typeof window === "undefined") return
  
  // Use native Notification API for immediate local push
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("💰 PaisaX Wallet Credit", {
        body: `₹${amount.toLocaleString("en-IN")} credited — ${reason}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `wallet-credit-${Date.now()}`,
      })
    } catch {
      // SW notification fallback
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification("💰 PaisaX Wallet Credit", {
          body: `₹${amount.toLocaleString("en-IN")} credited — ${reason}`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `wallet-credit-${Date.now()}`,
        })
      }).catch(() => {})
    }
  }
}

/** Show a claim reminder notification for active plans */
export function notifyClaimReminder(planCount: number, dailyEarning: number) {
  if (typeof window === "undefined") return
  
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("⚡ Claim Your Daily Returns!", {
        body: `You have ${planCount} active plan${planCount > 1 ? "s" : ""} — ₹${dailyEarning.toLocaleString("en-IN")}/day waiting to be claimed!`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "claim-reminder",
        requireInteraction: true,
      })
    } catch {
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification("⚡ Claim Your Daily Returns!", {
          body: `You have ${planCount} active plan${planCount > 1 ? "s" : ""} — ₹${dailyEarning.toLocaleString("en-IN")}/day waiting to be claimed!`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "claim-reminder",
        })
      }).catch(() => {})
    }
  }
}

/** 
 * Setup periodic claim reminders using the Notifications API.
 * Checks every hour if user has unclaimed daily returns.
 */
let reminderInterval: ReturnType<typeof setInterval> | undefined

export function setupClaimReminders(getActivePlans: () => { count: number; dailyEarning: number } | null) {
  if (typeof window === "undefined") return
  if (reminderInterval) return // Already set up
  
  // Check every 2 hours
  reminderInterval = setInterval(() => {
    const info = getActivePlans()
    if (info && info.count > 0) {
      notifyClaimReminder(info.count, info.dailyEarning)
    }
  }, 2 * 60 * 60 * 1000) // 2 hours
  
  // Also check once after 30 seconds of page load
  setTimeout(() => {
    const info = getActivePlans()
    if (info && info.count > 0) {
      // Only remind if it's between 8 AM and 10 PM
      const hour = new Date().getHours()
      if (hour >= 8 && hour <= 22) {
        notifyClaimReminder(info.count, info.dailyEarning)
      }
    }
  }, 30_000)
}

/** Request notification permission proactively */
export function requestNotificationPermission() {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission === "default") {
    Notification.requestPermission()
  }
}

/** Cleanup (call on logout) */
export function cleanupNotifications() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = undefined
  }
  initialized = false
}
