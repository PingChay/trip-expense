---
name: TripSplit
description: An iPhone app that happens to load from a link; Thai trip expense splitting in the iOS system idiom.
colors:
  tint: "#007aff"
  tint-dark: "#0a84ff"
  grouped: "#f2f2f7"
  grouped-dark: "#000000"
  cell: "#ffffff"
  cell-dark: "#1c1c1e"
  label: "#000000"
  label-dark: "#ffffff"
  label-2: "#6e6e73"
  label-2-dark: "rgb(235 235 245 / 0.6)"
  label-3: "rgb(60 60 67 / 0.6)"
  label-3-dark: "rgb(235 235 245 / 0.45)"
  separator: "rgb(60 60 67 / 0.29)"
  separator-dark: "rgb(84 84 88 / 0.65)"
  fill: "rgb(120 120 128 / 0.2)"
  fill-3: "rgb(118 118 128 / 0.12)"
  fill-3-dark: "rgb(118 118 128 / 0.24)"
  pressed: "#e5e5ea"
  pressed-dark: "#2c2c2e"
  green: "#34c759"
  green-dark: "#30d158"
  red: "#ff3b30"
  red-dark: "#ff453a"
  orange: "#ff9500"
  orange-ink: "#c93400"
  orange-ink-dark: "#ffb340"
  positive: "#248a3d"
  positive-dark: "#30d158"
  negative: "#d70015"
  negative-dark: "#ff6961"
  pass: "#1c1c1e"
  pass-dark: "#2c2c2e"
  pass-label: "rgb(235 235 245 / 0.6)"
  hue-avatar: "oklch(0.92 0.06 var(--hue))"
  hue-avatar-dark: "oklch(0.36 0.07 var(--hue))"
  hue-ink: "oklch(0.42 0.11 var(--hue))"
  hue-ink-dark: "oklch(0.88 0.08 var(--hue))"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Sukhumvit Set, Thonburi, Noto Sans Thai, Leelawadee UI, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.2
  title1:
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.22
  title2:
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.27
  title3:
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.35
  callout:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
  subhead:
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.38
  footnote:
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
  caption2:
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
  trip-id:
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  field-sm: "0.5rem"
  field: "0.75rem"
  menu: "0.875rem"
  group: "1.25rem"
  pass: "1.375rem"
  sheet: "2rem"
  full: "9999px"
spacing:
  row-x: "16px"
  row-y: "10px"
  row-gap: "12px"
  page-x: "16px"
  section-gap: "28px"
  separator-inset: "16px"
  avatar-inset: "60px"
components:
  button-filled:
    backgroundColor: "{colors.tint}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
    typography: "{typography.body}"
  button-filled-large:
    backgroundColor: "{colors.tint}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "52px"
  button-gray:
    backgroundColor: "{colors.fill-3}"
    textColor: "{colors.label}"
    rounded: "{rounded.full}"
    height: "44px"
  button-plain:
    textColor: "{colors.tint}"
    rounded: "{rounded.full}"
    height: "44px"
  input:
    backgroundColor: "{colors.fill-3}"
    textColor: "{colors.label}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "44px"
  grouped-section:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.group}"
  grouped-row:
    padding: "10px 16px"
    height: "44px"
  section-header:
    textColor: "{colors.label-2}"
    typography: "{typography.footnote}"
    padding: "0 16px 6px"
  choice-pill:
    backgroundColor: "{colors.fill-3}"
    textColor: "{colors.label}"
    rounded: "{rounded.full}"
    height: "40px"
  choice-pill-selected:
    backgroundColor: "{colors.tint}"
    textColor: "#ffffff"
  avatar:
    backgroundColor: "{colors.hue-avatar}"
    textColor: "{colors.hue-ink}"
    rounded: "{rounded.full}"
    size: "32px"
  boarding-pass:
    backgroundColor: "{colors.pass}"
    textColor: "#ffffff"
    rounded: "{rounded.pass}"
    padding: "16px 20px 20px"
  tab-bar:
    rounded: "{rounded.full}"
    height: "64px"
  sheet:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.sheet}"
---

# Design System: TripSplit

## Overview

**Creative North Star: "An iPhone App That Happens To Load From A Link"**

TripSplit borrows the arrangement every iPhone user already reads without thinking: a large title that collapses into a translucent bar, inset grouped lists on the grouped-background grey, capsule buttons, bottom sheets with a grabber, and a floating glass tab bar. Nothing is bespoke chrome. Every colour is an iOS semantic role (grouped background, cell, label, secondary label, separator, fill, tint), so light and dark come from one set of names and the phone's own setting decides which.

Density is the density of Settings and Wallet: 44px minimum rows, hairline separators inset to the text edge, footnote-sized section headers in secondary grey, and generous 28px gaps between sections. Money reads as numbers first: tabular figures, semibold, with the currency set small beneath or beside. Copy is Thai, so the type ramp runs a little taller than Apple's to give stacked marks room.

Two things are allowed to be expressive. Families carry one hue each, and that hue lives only in monogram avatars. And the trip dashboard opens on a single Wallet boarding pass, the one signature move. Everything else stays system.

**Key Characteristics:**
- iOS semantic tokens (`--ios-*`) for every colour, swapped wholesale under `prefers-color-scheme: dark`.
- System Blue is the only interactive tint.
- Inset grouped sections (20px radius) with half-pixel separators inset to the text edge.
- Floating glass controls: round bar buttons, a capsule tab bar with the add-bill + in its centre.
- Bottom sheets on native `<dialog>` with a grabber and pull-to-dismiss.
- Family colour as hue only, rendered through avatar fill and ink.
- Lucide line icons stand in for SF Symbols, which cannot be licensed for the web.

## Colors

The iOS system palette, light and dark, with the accessibility adjustments the build needed.

### Primary
- **System Blue** (tint / tint-dark): the only interactive colour. Filled buttons, plain text buttons, links in rows, selected tab, selected choice pill, checkbox fill, focus outline, caret and selection. Anything blue can be tapped.

### Secondary
- **System Green / Red / Orange** (green, red, orange): status fills only. Green is the "settled" check disc, the copied-link state and the switch track; red is destructive icons and fills, while destructive text labels (ลบบิล, ลบสมาชิก) use the negative ink for 4.5:1; orange at 15% under orange-ink marks advance/payment entries.
- **Money Green / Money Red** (positive, negative): the increased-contrast system green and red, used for money direction as text. Small text never sits in the stock system green or red.

### Tertiary
- **Family Hue** (hue-avatar, hue-ink): each family (or solo member) gets one hue, stepped by the golden angle from 225 so no two keys in a trip collide. The appearance supplies lightness and chroma: a pale fill with dark ink in light mode, a deep fill with pale ink in dark. The element supplies only `--hue`.

### Neutral
- **Grouped Background** (grouped): page behind every screen; also cuts the pass perforations.
- **Cell** (cell): grouped sections, sheets, menus.
- **Label** (label): primary text.
- **Secondary Label** (label-2): section headers, footers, subtitles, metadata, placeholders. Light value is Apple's web grey rather than the iOS 60% alpha so small text clears 4.5:1.
- **Tertiary Label** (label-3): chevrons, transfer arrows, empty-state icons, unchecked ring. Dark value raised from iOS's 0.3 to 0.45 alpha so glyphs clear 3:1 on cells.
- **Separator** (separator): hairlines between rows and under the scrolled nav bar.
- **Fill** (fill, fill-3): fill-3 is the field and gray-button surface; fill is the sheet grabber and disabled switch.
- **Pressed** (pressed): row highlight while touched.
- **Pass Graphite** (pass, pass-label): the boarding pass body and its field labels, the home-screen app tile.

### Named Rules
**The One Tint Rule.** System Blue means "tap here", and nothing else is blue. Status colours never become buttons in their own hue except the destructive red.

**The Hue-Only Family Rule.** A family's colour is a hue on an avatar. It never tints row backgrounds, text, borders or money.

**The Contrast-Adjusted Rule.** Small text uses label-2 (#6E6E73 light) and money text uses positive/negative, not stock systemGreen/systemRed. Placeholders are label-2, not label-3.

## Typography

**Display Font:** System UI (SF Pro on Apple devices) with the phone's Thai face (Sukhumvit Set, Thonburi, Noto Sans Thai, Leelawadee UI)
**Body Font:** Same stack
**Label/Mono Font:** ui-monospace / SF Mono, for Trip IDs only

**Character:** The phone's own voice. Because the world is iOS, the system face is the native material here, not a fallback; hierarchy comes from Apple's text-style sizes and weight, never from a second family.

### Hierarchy
- **Large Title** (700, 2.125rem, 1.2): top-level screen title (trip name, home) below the bar, collapsing into the bar on scroll.
- **Title 1 / Title 2** (700, 1.75rem / 1.375rem): join screen trip name, QR sheet amount, not-found heading.
- **Title 3** (600–700, 1.25rem, 1.3): pass figures, empty-state headings, totals.
- **Body** (400, 1.0625rem, 1.35): rows, fields, buttons, inline nav title (semibold).
- **Subhead** (400, 0.9375rem): large-title subtitle (Thai dates), member lists, choice pills, secondary row text.
- **Footnote** (400, 0.8125rem): section headers and footers, segmented control labels.
- **Caption / Caption 2** (500–600, 0.75rem / 0.6875rem): currency codes, pass field labels, tab labels.
- **Trip ID** (mono 600, 1.625rem, 0.08em tracking): the ID on the boarding pass; smaller mono with wide tracking in lists.

### Named Rules
**The Text Style Rule.** Size only through the named text styles (`text-large-title` … `text-caption2`); `cn()` is extended so tailwind-merge treats them as sizes. No arbitrary font sizes except the pass Trip ID.

**The Tabular Money Rule.** Every amount and count is `tabular-nums`, semibold, with its currency smaller and in a quieter colour.

**The Thai Date Rule.** Dates render through `formatTripDates` in Thai Buddhist-era short form (e.g. "21–23 ส.ค. 2569"), read as UTC so the day never shifts.

## Layout

Single column, phone-width: content sits in a centred `max-w-md` (28rem) column with 16px side padding, on desktop as on mobile (desktop shows the same column centred on grouped grey). Sections stack with 28px gaps; section headers sit 16px in from the group edge with 6px below. Rows are at least 44px tall with 16px horizontal and 10px vertical padding and 12px between leading avatar and text. Separators start at the text edge: 16px by default, 60px when rows lead with a 32px avatar, 48px for transfer rows.

The nav bar is sticky, 52px plus the safe-area top inset; it is clear at the top of the page and turns to material with a hairline once content scrolls beneath. Trip screens reserve bottom padding (safe area + 7.5rem) for the floating tab bar, which sits 12px above the home indicator. Sheets float 8px from the screen edges and become a centred 24rem dialog at 640px and up.

## Elevation & Depth

Depth is material first, shadow second. Bars and floating controls are translucent blurred material over content; grouped cells sit flat on the grouped background with no shadow at all. Shadows are soft, negative-spread and reserved for things that genuinely float.

### Shadow Vocabulary
- **Glass control** (`0 2px 10px -2px rgb(0 0 0 / 0.12), inset 0 0 0 0.5px label at 8%`): bar buttons and the tab bar, with 16px blur.
- **Sheet** (`0 -8px 40px -12px rgb(0 0 0 / 0.35)`): bottom sheets, over a 32% black backdrop.
- **Pass** (`0 10px 30px -12px rgb(0 0 0 / 0.5)`): the boarding pass only.
- **Menu** (`0 10px 40px -8px rgb(0 0 0 / 0.3)`): popover menus on material.
- **Thumb** (`0 3px 8px rgb(0 0 0 / 0.12), 0 3px 1px rgb(0 0 0 / 0.04)`): segmented-control thumb and switch knob.
- **Bar hairline** (`0 0.5px 0 separator`): the scrolled nav bar's bottom edge.

### Named Rules
**The Flat Cell Rule.** Grouped sections never carry a shadow or a border; the grey-on-white step is the whole separation.

**The Material Bar Rule.** Anything that floats over scrolling content (nav bar, tab bar, bar buttons, menus) is blurred material (`saturate(180%)`, 16–20px blur), never an opaque slab.

## Shapes

Continuous, generous rounding throughout, sized to the object: capsules (full) for every button, pill, tab bar and avatar; 20px for grouped sections; 22px for the pass; 32px for sheets; 12px for standalone fields and 8px for compact inline fields; 14px for menus; 24px for the QR frame. No hard corners anywhere and no outlines as decoration; the only strokes are hairline separators, the 1.5px checkbox ring and the dotted pass perforation.

## Components

### Buttons
Capsules that press in.
- **Shape:** full capsule; 44px default, 52px large, 32px/28px small.
- **Filled:** tint with white semibold text. **Tinted:** tint at 15% with tint text. **Gray:** fill-3 with label text. **Plain:** tint text, fill-3 on hover. **Destructive:** red at 15% with negative-ink text.
- **Press / Focus:** scale to 0.97 and 80% opacity on press; 2px tint focus outline offset 2px; disabled at 40% opacity.
- **Bar buttons:** 44px glass circles with a label-coloured glyph (back, close), glass text capsules (ยกเลิก), and a filled-tint capsule for the confirming action (บันทึก).

### Chips (choice pills)
- **Style:** 40px capsule, fill-3 with label text, leading 24px avatar.
- **State:** selected turns tint with white semibold text; radio semantics.

### Segmented Control
- fill-3 capsule track with 2px inset; the selected segment is a cell-coloured capsule thumb with the thumb shadow (dark: #636366). Footnote semibold labels.

### Cards / Containers (Grouped Section)
- **Corner Style:** 20px.
- **Background:** cell on grouped.
- **Shadow Strategy:** none (Flat Cell Rule).
- **Border:** none; inner rows separated by half-pixel hairlines inset to the text edge, never under the last row.
- **Internal Padding:** rows at 16px / 10px; header in footnote label-2 above, optional plain-tint action on the header line, footer in footnote label-2 below.
- **Rows:** navigating rows end in a 16px label-3 chevron and highlight to pressed on touch.

### Inputs / Fields
- **Style:** filled fill-3, no border, 12px radius, 44px tall, body text, label-2 placeholder. Inside a grouped row a field goes transparent and borderless.
- **Focus:** 2px tint ring at 40%.
- **Error / Disabled:** 2px red ring at 50%; disabled at 50% opacity.
- **Checkbox:** 22px circle with a 1.5px label-3 ring that fills with tint and a white check.
- **Switch:** 51×31 capsule, green when on, fill when off, white 27px knob.

### Navigation
- **Nav bar:** sticky, clear at rest, material-bar with hairline once scrolled; large title below on top-level screens collapses into a centred semibold body title.
- **Tab bar:** a floating glass capsule, 64px tall, five equal tabs with 24px lucide icons over caption2 semibold labels. Active tab: fill-3 capsule, tint icon and label, heavier stroke. The centre tab (เพิ่มบิล) is a 32px tint disc with a white + and a tint label. Pending tabs show a spinner and "กำลังเปิด".

### Sheet
Native `<dialog>` floating 8px from the edges, 32px radius, elevated cell surface, 36×5 fill grabber, glass close button top right. Rises with `cubic-bezier(0.32, 0.72, 0, 1)` over 420ms; pull down 96px from the grabber/header to dismiss. Reduced motion: fade only.

### Member Avatar
Circular monogram at 24/32/40px in the family's hue-avatar fill and hue-ink letter (Thai leading vowels kept with their consonant). Group avatars use a users glyph in the same hue. Members of a family share the family's hue.

### Wallet Boarding Pass (signature)
Pass-graphite card, 22px radius, white text, pass shadow. Header line: plane glyph + "TripSplit", "บัตรทริป" at right. Then the Trip ID in mono, a white copy-link capsule and a translucent-white share capsule. A perforation (two grouped-colour half-circles and a dotted white-20% rule) splits it from a three-column stub: members, bills, total, each a caption pass-label over title3 semibold figures. It appears once, on the trip dashboard.

## Do's and Don'ts

### Do:
- **Do** use the `--ios-*` semantic tokens (via `bg-grouped`, `bg-cell`, `text-label`, `text-label-2`, `bg-fill-3`, `text-tint`) so dark mode follows the system with no per-component overrides.
- **Do** build lists as inset grouped Sections with 44px+ rows and separators inset to the text edge (60px after a 32px avatar).
- **Do** put money in `tabular-nums` semibold with the currency smaller, and colour direction with positive/negative only.
- **Do** carry family identity through the avatar hue and nothing else.
- **Do** keep the add-bill + as the centre tint disc inside the floating tab bar.
- **Do** use lucide line icons at 2–2.5 stroke as the SF Symbols stand-in, label-coloured in bars and label-3 for chevrons and arrows.
- **Do** format dates with `formatTripDates` (Thai, Buddhist era, UTC).

### Don't:
- **Don't** return to the "website with cards" arrangement: bordered white cards on slate, bespoke chips and boxes.
- **Don't** introduce a second interactive colour; blue is the only tint.
- **Don't** put family hues on row backgrounds, text, borders or amounts.
- **Don't** use stock systemGreen/systemRed or label-3 for small text; they fail contrast.
- **Don't** add a manual light/dark toggle; appearance follows the phone.
- **Don't** repeat the boarding pass treatment on other screens; it is the dashboard's one signature.
- **Don't** add shadows or borders to grouped sections, or opaque fills to bars and floating controls.
