"use client"

import NotificationCenter from "@/components/ui/notification-center"

export default function NotificationCenterExample() {
  return (
    <NotificationCenter
      cardTitle="Real-time payment alerts"
      cardDescription="Get instant updates for every successful recharge & withdrawal transaction processed through your account."
      notificationTitle="PaisaX Solar"
      notificationDescription="You received a daily income return of ₹320.00"
      notificationTime="Just now"
    />
  )
}
