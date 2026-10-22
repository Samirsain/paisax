"use client"

import { CopyIcon, FlaskConicalIcon, Share2Icon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"
import { CoinIcon, Skeleton } from "@/components/marks"
import { Button } from "@/components/ui/button"
import { INVITE_BONUS } from "@/lib/game"
import { fmt, useStore } from "@/lib/store"
import { card, cn } from "@/lib/utils"

const STEPS = [
  { icon: Share2Icon, title: "Share your code or link", tile: "bg-primary-fixed text-primary" },
  { icon: UserPlusIcon, title: "A friend signs up on PaisaX", tile: "bg-amber-soft text-amber" },
  { icon: CoinIcon, title: `You get ${INVITE_BONUS} coins`, tile: "bg-mint/35 text-claim" },
]

export default function ReferPage() {
  const { ready: loaded, state, invite } = useStore()
  if (!loaded) return <Skeleton />

  const link = `${location.origin}/?invite=${state.inviteCode}`

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied`)
    } catch {
      toast.error(`Couldn't copy. Your ${what.toLowerCase()} is ${text}`)
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "PaisaX", text: `Join me on PaisaX. My invite code is ${state.inviteCode}.`, url: link })
      } catch {
        // the share sheet was closed: nothing to do
      }
    } else {
      copy(link, "Invite link")
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <section className="rounded-2xl bg-gradient-to-br from-primary-container to-primary p-6 text-center text-white shadow-lg shadow-primary/25">
        <p className="text-label-lg opacity-90">Your invite code</p>
        <p className="mt-2 text-[36px] leading-tight font-bold tracking-[0.08em]">{state.inviteCode}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => copy(state.inviteCode, "Code")} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-label-lg text-primary active:scale-[0.98]">
            <CopyIcon className="size-5" aria-hidden /> Copy code
          </button>
          <button type="button" onClick={share} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/20 text-label-lg text-white active:scale-[0.98]">
            <Share2Icon className="size-5" aria-hidden /> Share link
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn(card, "p-4")}>
          <p className="text-label-md text-on-variant">Friends joined</p>
          <p className="mt-1 text-stat text-on-surface">{state.invites}</p>
        </div>
        <div className={cn(card, "p-4")}>
          <p className="text-label-md text-on-variant">Bonus coins</p>
          <p className="mt-1 text-stat text-claim">{fmt(state.invites * INVITE_BONUS)}</p>
        </div>
      </div>

      <section aria-labelledby="how" className={cn(card, "p-5")}>
        <h2 id="how" className="text-headline-sm text-on-surface">
          How it works
        </h2>
        <ol className="mt-4 flex flex-col gap-4">
          {STEPS.map(({ icon: Icon, title, tile }) => (
            <li key={title} className="flex items-center gap-3">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tile)} aria-hidden>
                <Icon className="size-5" />
              </span>
              <span className="text-body-lg text-on-surface">{title}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="simulate" className="flex flex-col gap-4 rounded-xl bg-surface-low p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-on-variant">
            <FlaskConicalIcon className="size-5" aria-hidden />
          </span>
          <div>
            <h2 id="simulate" className="text-label-lg text-on-surface">
              Simulate a referral
            </h2>
            <p className="mt-0.5 text-body-sm text-on-variant">Tap below to test how the referral bonus lands in your wallet.</p>
          </div>
        </div>
        <Button
          variant="soft"
          size="lg"
          className="bg-white shadow-card"
          onClick={() => {
            invite()
            toast.success(`+${INVITE_BONUS} coins`, { description: "Referral bonus credited!" })
          }}
        >
          <UserPlusIcon aria-hidden /> Test referral bonus
        </Button>
      </section>
    </div>
  )
}
