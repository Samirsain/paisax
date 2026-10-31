"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth"
import {
  initOneSignal,
  tagOneSignalUser,
  setupClaimReminders,
  requestNotificationPermission,
} from "@/lib/notifications"
import { active, getPlan } from "@/lib/game"

/**
 * Invisible provider component that:
 * 1. Initializes OneSignal SDK on mount
 * 2. Tags the current user with their ID & phone
 * 3. Sets up periodic claim reminders for active plans
 * 4. Requests notification permission after a delay
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

  // Request permission after a small delay (UX-friendly)
  useEffect(() => {
    const timer = setTimeout(() => {
      requestNotificationPermission()
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

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

  return null // Invisible provider
}
