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

interface OneSignalInstance {
  init: (config: Record<string, unknown>) => Promise<void>
  login?: (id: string) => Promise<void>
  User?: {
    addTags?: (tags: Record<string, string>) => Promise<void>
    PushSubscription?: {
      optIn?: () => Promise<void>
    }
  }
  Notifications?: {
    requestPermission?: () => Promise<void>
  }
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalInstance) => Promise<void>>
    OneSignal?: OneSignalInstance
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
  window.OneSignalDeferred.push(async function (OneSignal: OneSignalInstance) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: "web.onesignal.auto.379e9ba9-232a-4433-a939-20e3e6310530",
      notifyButton: {
        enable: false,
      },
      allowLocalhostAsSecureOrigin: true,
    })
  })
}

/** Tag the user with their PaisaX user ID and phone for targeted push */
export function tagOneSignalUser(userId: string, phone?: string) {
  if (typeof window === "undefined") return
  
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function (OneSignal: OneSignalInstance) {
    try {
      await OneSignal.login?.(userId)
      await OneSignal.User?.addTags?.({
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

/** Request notification permission via OneSignal or native API */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported"
  }

  let permission: NotificationPermission = Notification.permission

  if (permission === "granted" || permission === "denied") {
    return permission
  }

  // 1. Try OneSignal v16 API if available
  try {
    if (window.OneSignal?.Notifications?.requestPermission) {
      await window.OneSignal.Notifications.requestPermission()
      return Notification.permission
    }
  } catch (err) {
    console.warn("OneSignal requestPermission error:", err)
  }

  // 2. Native Notification.requestPermission()
  try {
    permission = await Notification.requestPermission()
  } catch {
    try {
      permission = await new Promise((resolve) => {
        Notification.requestPermission(resolve)
      })
    } catch {}
  }

  // 3. Register push opt-in with OneSignal if granted
  if (permission === "granted") {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function (OneSignal: OneSignalInstance) {
      try {
        await OneSignal.User?.PushSubscription?.optIn?.()
      } catch {}
    })
  }

  return permission
}

/** Local confirmation notification triggered when user grants permission */
export function notifyPermissionGranted() {
  if (typeof window === "undefined") return
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("🎉 PaisaX Notifications Enabled!", {
        body: "You're all set to receive daily earnings and wallet updates.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      })
    } catch {
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification("🎉 PaisaX Notifications Enabled!", {
          body: "You're all set to receive daily earnings and wallet updates.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        })
      }).catch(() => {})
    }
  }
}

/** Open the notification permission prompt popup manually */
export function openNotificationPrompt() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("paisax_open_notification_prompt"))
  }
}

/** Trigger an immediate test browser push notification (ideal for localhost testing) */
export async function sendTestNotification(
  title = "💰 PaisaX Solar Return Received",
  message = "₹320.00 daily return has been credited to your wallet!",
  url = "/my-plans"
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }

  if (Notification.permission !== "granted") {
    const perm = await requestNotificationPermission()
    if (perm !== "granted") return false
  }

  try {
    const notif = new Notification(title, {
      body: message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `test-alert-${Date.now()}`,
    })
    if (url) {
      notif.onclick = () => {
        window.focus()
        window.location.href = url
      }
    }
    return true
  } catch {
    if (navigator.serviceWorker) {
      try {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification(title, {
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `test-alert-${Date.now()}`,
          data: { url },
        })
        return true
      } catch {
        return false
      }
    }
    return false
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
