---
version: 1
slug: "src-app-trips-id-page-tsx"
primary_target: "src/app/trips/[id]/page.tsx"
related_targets: ["src/app/page.tsx"]
---

# App shell (all trip screens)

Scope: every screen of the app (home, new trip, join, trip dashboard, bills, bill form, members, summary, PromptPay sheets). Mode: Operate.
Audience and job: Thai trip groups of up to 30; one or two people log bills on a phone mid-trip, everyone checks who transfers to whom.
Constraints: keep all functions, data, Thai copy and the family-colour system; keep the centre + (เพิ่มบิล) in the bottom bar (user decision); light and dark follow the phone.

## Direction contract

THESIS: TripSplit is an iPhone app that happens to load from a link. It refuses the "website with cards" arrangement (bordered white cards on slate, bespoke chips and boxes) and uses the arrangement every iPhone user already reads without thinking: large titles, inset grouped lists, sheets.
OWN-WORLD: iOS system palette as semantic tokens (systemGroupedBackground, secondarySystemGroupedBackground cells, label/secondaryLabel, hairline separators inset to the text edge, fills), systemBlue as the only interactive tint, systemGreen/systemRed for money direction, system font (SF Pro + the phone's Thai face). Family colours stay as the one expressive layer, carried by monogram avatars. Dark mode is first class.
STORY: Open the trip, see the pass and the transfers owed, tap a QR, pay, done; add a bill from the centre button in seconds.
FIRST VIEWPORT: Trip dashboard: translucent nav bar, large title = trip name with dates; a Wallet-style boarding pass (Trip ID, copy/share, members/bills/total) as the signature; then an inset grouped "ต้องโอนเงิน" section with QR buttons; floating glass tab bar with the centre + at the bottom.
FORM: pinned by the user ("style Mobile iOS"), no roll; signature move: the trip as an Apple Wallet boarding pass. seed: none (direction pinned by the user, so no concept roll was run)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
