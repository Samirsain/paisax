"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Toasts sit just above the tab bar, one at a time, styled like the app's cards.
const aboveTabBar = { bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      visibleToasts={1}
      offset={aboveTabBar}
      mobileOffset={{ ...aboveTabBar, left: "1rem", right: "1rem" }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-claim" />,
        info: <InfoIcon className="size-5 text-primary" />,
        warning: <TriangleAlertIcon className="size-5 text-amber" />,
        error: <OctagonXIcon className="size-5 text-destructive" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "gap-3! rounded-xl! border-0! bg-white! p-4! shadow-[0_10px_28px_-10px_rgb(19_27_46/0.3)]! font-sans!",
          title: "text-label-lg! text-on-surface!",
          description: "text-body-sm! text-on-variant!",
          actionButton: "h-8! rounded-lg! bg-primary! px-3! text-label-md! text-white!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
