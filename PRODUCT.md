# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first web app and installable PWA (`public/manifest.json`, portrait, standalone). Mobile web is still `web`: there is no native wrapper.

## Users

Groups of Thai friends or families travelling together, up to about 30 people in one trip. One or two people record bills on their phone during the trip, some from the PWA on their home screen. Everyone else opens the shared trip link to see who has to transfer money to whom.

## Product Purpose

TripSplit splits a trip's spending without anyone signing up. Each bill names who paid and who shares it; the app works out each person's and each family's balance and the fewest transfers that settle the trip. Success is a group that leaves the trip knowing exactly who pays whom, and pays it.

## Positioning

Built for how Thai groups actually travel: families settle as one unit, transfers settle in baht through a PromptPay QR made for the exact amount, and a recorded transfer clears the debt from the summary.

## Operating Context

- Used on phones, in the middle of the trip: at the restaurant table, in the van, at check-in. Often one-handed, often in a hurry.
- A trip is reached by its ID (e.g. `AWL-0588`) or a `/trips/[id]/join` link shared in a group chat. Recent trips are remembered on the device.
- Bills are entered right after paying; the summary is read at the end of the trip or whenever someone asks "how much do I owe?".

## Capabilities and Constraints

- Trips, members (optionally grouped into families), bills (expense or payment), per-person fixed amounts, multi-currency (THB, USD, EUR, JPY) with balances kept per currency.
- Settlement by person and by family; PromptPay QR and one-tap payment recording for THB transfers; PromptPay numbers set per member.
- No accounts, no auth. Data in Supabase. Next.js 16 App Router, Tailwind CSS 4, lucide icons.
- All UI copy is Thai.

## Brand Commitments

- Name: TripSplit.
- Visual language: iOS (user decision, 2026-11-02). The web app should look and behave like a native iPhone app, follow the phone's light/dark setting, and keep the centre "เพิ่มบิล" (+) button in the bottom bar.
- Each family has one colour, unique within the trip, shared by every member's avatar.

## Evidence on Hand

Real trips exist in the project's Supabase (for example `AWL-0588` with 19 members in five families and 15 bills). No testimonials, metrics, or marketing material exist; do not invent them.

## Product Principles

1. Answer "who pays whom" before anything else.
2. Recording a bill takes seconds and one hand.
3. A family reads as one unit everywhere: entry, lists, and settlement.
4. Nobody needs an account, an install, or instructions.
5. Thai first: copy, names, PromptPay, and baht formatting.
