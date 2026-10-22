---
name: DailyEarn
description: A calm daily coin game, built as a phone-width PWA in the Stitch Material 3 system.
colors:
  primary: "#4648d4"
  primary-container: "#6063ee"
  primary-fixed: "#e1e0ff"
  claim: "#006c49"
  claim-hover: "#005236"
  mint: "#6cf8bb"
  on-mint: "#00714d"
  amber: "#825100"
  amber-soft: "#ffddb8"
  rose: "#9c1d50"
  rose-soft: "#ffd9e2"
  destructive: "#ba1a1a"
  background: "#faf8ff"
  page-margin: "#eceefb"
  card: "#ffffff"
  surface-low: "#f2f3ff"
  surface-mid: "#eaedff"
  surface-high: "#e2e7ff"
  on-surface: "#131b2e"
  on-variant: "#464554"
  outline: "#767586"
  input: "#c7c4d7"
  border: "#e4e6f5"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "48px"
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  stat:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "30px"
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline-lg:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "34px"
    letterSpacing: "-0.015em"
  headline-md:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body-lg:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-md:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  body-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  label-lg:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.01em"
  label-md:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.02em"
  label-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "14px"
    letterSpacing: "0.04em"
rounded:
  lg: "12px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  gutter: "16px"
  card-sm: "16px"
  card-md: "20px"
  card-lg: "24px"
  grid: "12px"
  section: "24px"
components:
  button-claim:
    backgroundColor: "{colors.claim}"
    textColor: "{colors.card}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: "52px"
    padding: "0 20px"
  button-claim-hover:
    backgroundColor: "{colors.claim-hover}"
  button-buy:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: "52px"
    padding: "0 20px"
  button-buy-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 16px"
  button-soft:
    backgroundColor: "{colors.surface-mid}"
    textColor: "{colors.on-variant}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 16px"
  button-soft-hover:
    backgroundColor: "{colors.surface-high}"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "16px"
  inset-panel:
    backgroundColor: "{colors.surface-low}"
    rounded: "{rounded.xl}"
    padding: "16px"
  chip-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.on-mint}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  chip-indigo:
    backgroundColor: "{colors.primary-fixed}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  chip-amber:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  chip-neutral:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.on-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  plan-tile:
    rounded: "{rounded.xl}"
    size: "48px"
  tab-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.on-variant}"
    typography: "{typography.label-sm}"
    height: "64px"
  tab-active-pill:
    backgroundColor: "{colors.primary-fixed}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    width: "48px"
    height: "32px"
  bottom-sheet:
    backgroundColor: "{colors.card}"
    rounded: "24px 24px 0 0"
    padding: "12px 20px 20px"
---

# Design System: DailyEarn

## Overview

**Creative North Star: "The Calm Daily Ledger"**

DailyEarn is the user's Stitch reference system (Material 3 colour roles, Inter) rebuilt as an installable phone app. One lavender-white column holds white cards that lift off the ground through soft shadow alone, never through borders. Colour does the semantic work: indigo is for moving forward and buying, emerald is reserved for claiming, mint marks good states, amber marks what is ready. Every number is a plain coin count set in tabular figures.

The density is a phone app's: a 16px gutter, 24px between sections, 12px between paired cards. The claim card is the hero of Home; indigo-gradient summary cards head Wallet, My Plans and Refer. Motion is reserved for reward moments (the count easing to zero, the level-up dialog, the plan-activated check) and is fully skipped under reduced motion.

Coins are a game currency, so the visuals never borrow from finance: no currency glyphs, no ROI badges, no capacity or scarcity bars.

**Key Characteristics:**
- One phone-width column (max 448px) on every viewport; desktop centres it on a slightly deeper lavender margin.
- White cards, 12px corners, soft two-layer shadow, no border.
- Indigo for action and buying, emerald only for claiming.
- Pill chips and round-cornered icon tiles carry status and plan identity.
- Inter throughout, with a custom label/body/headline/stat/display scale and tabular numerals.

## Colors

A cool lavender-white ground with an indigo voice, an emerald claim signal, and three soft status tints.

### Primary
- **Stitch Indigo** (primary): primary actions, Buy buttons, the wordmark, links, the active tab, focus outlines, caret, and the "balance after" figure.
- **Bright Indigo** (primary-container): the light end of the indigo summary gradient (Bright Indigo to Stitch Indigo, bottom-right).
- **Indigo Mist** (primary-fixed): the active-tab pill, indigo chips, the Starter plan tile, today's check-in tile, and text selection.

### Secondary
- **Claim Emerald** (claim): the Claim button, the coin icon beside the ready count, positive history amounts, success toasts. Darkens to **Deep Emerald** (claim-hover) on hover.
- **Fresh Mint** (mint) with **Mint Ink** (on-mint): mint is used only as a tint (20 to 45% alpha) behind good states such as claimed check-in days, "Daily claim ready", and the activated-plan check halo.

### Tertiary
- **Harvest Amber** (amber) on **Apricot** (amber-soft): "Ready" chips, the Premium tile, info notes, and warning toasts.
- **Berry Rose** (rose) on **Blush** (rose-soft): the Elite plan tile only.
- **Error Red** (destructive): destructive confirms (reset data) and error toasts.

### Neutral
- **Lavender White** (background): the app ground.
- **Periwinkle Margin** (page-margin): the html canvas outside the column on wide screens.
- **Card White** (card): cards, sheets, dialogs, toasts; the app bar and tab bar at 80 to 85% opacity with blur.
- **Surface Low / Mid / High**: a three-step tonal ladder for inset panels (order summary, claim breakdown), soft buttons, skeletons, progress tracks, filter pills, and the neutral chip.
- **Midnight Ink** (on-surface): primary text. **Slate Ink** (on-variant): secondary text and inactive tabs. **Outline** and **Input**: strokes on fields and scrollbars. **Hairline** (border): the one in-card divider (the order summary's total row).

### Named Rules
**The Emerald Means Claim Rule.** Emerald fills belong to claiming and to success. Buying, navigating and confirming are indigo. A screen never has two filled emerald buttons.

**The Status-Not-By-Colour Rule.** Every tinted chip carries a word and usually an icon or dot ("Ready" with a clock, "Claimed" with a check). Colour reinforces state; it never carries it alone.

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui)
**Body Font:** Inter
**Label Font:** Inter

**Character:** One family, worked by weight and tracking. Numbers tighten (negative tracking, bold) and labels open up (positive tracking, semibold to bold), so a coin count reads as the loudest thing on any card.

### Hierarchy
- **Display** (700, 40px/48px, -0.02em): the ready-to-claim count on Home. One per screen.
- **Stat** (700, 24px/30px, -0.02em): card figures such as Coin balance, Lifetime coins, Balance after.
- **Headline lg** (700, 28px/34px): dialog and success titles ("Level 4 reached!", "Growth Plan is running!").
- **Headline md** (600, 22px/28px): screen greetings and section heads ("Coin history", "Active Plans").
- **Headline sm** (600, 18px/24px): card titles, plan names, the app-bar wordmark and sub-page titles.
- **Body lg / md / sm** (400; 16/24, 14/20, 12/16): descriptions, list secondary lines, timestamps and fine print.
- **Label lg / md / sm** (600 to 700; 14/20, 12/16, 11/14; +0.01 to +0.04em): button text, chips, stat captions, tab labels.

### Named Rules
**The Tabular Coins Rule.** The body sets `font-variant-numeric: tabular-nums`, so counts that tween or sit in columns never jitter.

**The Scale-Only Rule.** Text sizes come from the eleven named steps above. Class merging is configured to know them, so they resolve as sizes rather than colours.

## Layout

The shell is one column, `max-width: 448px`, centred, full dynamic viewport height, on every screen size. From 768px up the column gains a hairline ring and a long soft shadow so it reads as an app on the periwinkle margin. There is no multi-column layout.

- **App bar:** sticky, 64px tall, white at 80% with a 24px blur and a faint 8px drop. The logo and indigo wordmark sit left; the Demo chip and the indigo avatar sit right. Sub-pages (Profile, Invite friends) swap the logo for a back chevron and a headline-sm title.
- **Content:** 16px side gutter, 12px top, and bottom padding of 96px plus the safe-area inset to clear the tab bar.
- **Rhythm:** 24px between sections, 12px between paired stat cards and list cards, 16 to 24px inside cards.
- **Tab bar:** fixed bottom, the same 448px width, 64px tall plus the safe-area inset, white at 85% with blur and an upward 16px shadow.
- Safe-area insets are respected at the top bar, the tab bar, bottom sheets and toasts.

## Elevation & Depth

Depth is soft and ambient. Cards separate from the lavender ground through a low two-layer shadow, never through a stroke. Hero surfaces get a stronger, tinted lift, and overlays lift upward from below. Every overlay uses one scrim: slate-900 at 40% with no blur.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgb(19 27 46 / 0.04), 0 4px 12px -2px rgb(19 27 46 / 0.06)`): every white card. Lists of tappable cards may deepen to a medium shadow on hover.
- **Hero** (`0 20px 25px -5px rgb(0 108 73 / 0.06), 0 8px 10px -6px rgb(0 108 73 / 0.05)`): the claim card only. It carries an emerald tint.
- **Lift** (`0 -8px 24px -8px rgb(19 27 46 / 0.16)`): bottom sheets and dialogs.
- **Indigo glow** (large shadow in primary at 20 to 25%): under the indigo-gradient summary cards.
- **Toast** (`0 10px 28px -10px rgb(19 27 46 / 0.3)`): the toast card above the tab bar.

### Named Rules
**The No-Line Card Rule.** Cards, sheets, dialogs and toasts have no border and no ring. Separation comes from shadow, or from a tonal step (Surface Low or Mid) for panels nested inside a card.

**The One Scrim Rule.** Every overlay, whether centred dialog or bottom sheet, uses the same slate-900 at 40% scrim with no backdrop blur.

## Shapes

Gently rounded and consistent. Cards, buttons, inset panels, plan tiles and toasts share 12px corners. Larger hero surfaces (the Wallet and Refer gradient cards, the level-up inner card) use 16px. Bottom sheets and the level-up dialog use 24px. Chips, filter pills, avatars, progress tracks, the active-tab pill and the sheet handle are fully round. Check-in day tiles keep the same 12px corners on a 56px-tall tile; today's tile adds a 2px indigo ring as a state marker, the one ring the system allows.

## Components

### Buttons
Confident and thumb-sized, with a slight press-in.
- **Shape:** 12px corners at the lg (44px) and xl (52px) sizes the app uses.
- **Claim:** emerald fill, white label-lg, a medium shadow that grows on hover, darkens to Deep Emerald, scales to 98% when pressed. Used only for claiming.
- **Buy:** indigo fill, white label-lg, a medium shadow, darkens to #3a3cc0 on hover, scales to 98% when pressed. Used for buying, sharing and "Keep playing".
- **Soft:** Surface Mid fill with Slate Ink text, stepping to Surface High on hover. The secondary choice inside sheets.
- **Ghost:** no fill, used for "Not now" and Close.
- **Focus:** a 2px indigo outline at 2px offset on every focusable element.
- Icons inside buttons are lucide line icons at 18 to 20px, leading the label.

### Chips
- **Style:** fully round, 4px by 10px, label-md, with a tinted fill and no stroke. Tones: mint (good), indigo (level, counts), amber (ready), neutral (Demo, "to L4").
- **State:** a leading 6px dot or a 14px icon pairs with the word. The claim card's status chip ("Daily claim ready", "All claimed") is the one place a chip is set in uppercase label-sm.

### Cards / Containers
- **Corner Style:** 12px (16px for gradient summary cards).
- **Background:** Card White on the lavender ground. Inset panels use Surface Low inside a card or sheet; the invite card is a flat Surface Mid block.
- **Shadow Strategy:** Card shadow at rest (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 16px for list and stat cards, 20 to 24px for hero and summary cards.

### Indigo Summary Card (signature)
A Bright Indigo to Stitch Indigo diagonal gradient with white text, an indigo glow beneath, and 20 to 24px padding. It heads Wallet (balance), My Plans (totals) and Refer (invite code), and it forms the band at the top of the level-up dialog. Secondary figures on it may use Fresh Mint. One per screen.

### Claim Card (signature)
The Home hero: white, 24px padding, the emerald-tinted Hero shadow, and two blurred decorative orbs (mint top-right, Indigo Mist bottom-left). It holds a status chip, a display-size count beside an emerald coin icon, a Surface Low "from" breakdown, and a full-width xl Claim button. Once everything is claimed, the button becomes a flat Surface Mid "Claimed for today" slab.

### Plan Icon Tiles
48px (40px in compact rows) with 12px corners, a lucide glyph at 45% of the tile, and a fixed tint per plan: Starter indigo, Growth mint and emerald, Premium apricot and amber, Elite blush and rose.

### Progress
An 8px fully round Surface Mid track with an indigo-to-emerald gradient fill that eases its width over 700ms. The label row above it reads "Progress (n%)" and "Day x of 30" in label-md.

### Inputs / Fields
The stock field (Profile name only): a 1px Input stroke, 12px corners, and the indigo focus treatment. It is not restyled beyond the base component.

### Navigation
A four-tab bottom bar (Home, Plans, My Plans, Wallet), each tab with a 22px lucide icon over a label-sm caption. The active tab turns indigo: its icon sits in a 48x32 Indigo Mist pill and its stroke thickens from 1.75 to 2.25. Inactive tabs are Slate Ink. Profile opens from the header avatar; Refer opens from Home and Wallet.

### Bottom Sheet
Confirm flows slide up from the bottom edge inside the same 448px column, with 24px top corners, a 40x6 slate handle, 20px side padding, the Lift shadow and the one scrim. The buy sheet shows an order summary panel, then swaps in place to a "Plan activated" success state.

### Dialog and Toast
Centred dialogs have 12px corners (24px for the level-up celebration) and the Lift shadow. Toasts are white 12px cards, borderless, one at a time, 84px above the bottom edge to clear the tab bar, each with a semantic lucide icon.

### Celebration Motion
Reward moments only: pop-in (700ms overshoot) for the trophy and success check, burst sparks in mint, apricot, white and indigo mist, a glow-in halo, staggered rise for the text, level-flip for the number, and fill-bar for the level bar. All are one-shot. Under `prefers-reduced-motion` they are switched off and the sparks are hidden.

## Do's and Don'ts

### Do:
- **Do** put every content group on a white 12px card with the Card shadow, on the Lavender White ground.
- **Do** keep emerald for claiming and success, and indigo for buying and navigation.
- **Do** pair every status tint with a word plus an icon or dot.
- **Do** use the named type steps; set coin counts in stat or display with tabular numerals.
- **Do** keep the single 448px column on every viewport, with safe-area padding at both bars.
- **Do** gate any new celebration animation behind the reduced-motion block.

### Don't:
- **Don't** add borders or rings to cards, sheets, dialogs or toasts.
- **Don't** blur the overlay scrim or introduce a second scrim colour.
- **Don't** show currency symbols, ROI or "returns" badges, capacity or scarcity bars, or real-company logos.
- **Don't** use more than one indigo summary card on a screen.
- **Don't** use countdown pressure or streak-loss threats in the visuals.
