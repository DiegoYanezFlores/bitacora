---
name: Bitácora
description: Registro de trabajo personal. Blanco frío y cobalto vivo en bloques enteros donde está el foco; todo lo demás calla.
colors:
  cobalt: "#2F4BF5"
  cobalt-strong: "#2238D1"
  cobalt-soft: "#E6EBFF"
  block: "#2F4BF5"
  block-ink: "#FFFFFF"
  block-ink-2: "#DDE4FF"
  milestone: "#FFA826"
  milestone-ink: "#A35A00"
  milestone-soft: "#FFF1DC"
  warn: "#9A5200"
  warn-soft: "#FFF3DF"
  danger: "#D1242F"
  bg: "#F5F7FB"
  surface: "#FFFFFF"
  surface-2: "#EDF0F7"
  text: "#0F1733"
  text-2: "#4A5470"
  text-3: "#5B6580"
  line: "#E1E6F0"
  line-2: "#CBD3E1"
  viz-1: "#C7D0FF"
  viz-2: "#8C9DFF"
  viz-3: "#5670FA"
  viz-4: "#2F4BF5"
  project-teal: "#0F9D84"
  project-blue: "#0284C7"
  project-violet: "#7C3AED"
  project-rose: "#DB2777"
  project-orange: "#EA580C"
  project-amber: "#A16207"
  project-green: "#16A34A"
  project-slate: "#64748B"
  dark-bg: "#0B1020"
  dark-surface: "#121833"
  dark-surface-2: "#1A2244"
  dark-text: "#EEF1FA"
  dark-text-2: "#A9B2CC"
  dark-cobalt: "#8FA2FF"
  dark-block: "#3551F2"
  dark-milestone: "#FFB547"
  dark-danger: "#FF7B7B"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  section-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    letterSpacing: "0.06em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "16px"
  pill: "999px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "20px"
  gutter-desktop: "24px"
  card: "16px"
  section: "28px"
  tap: "44px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.block-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-strong}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  button-small:
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    height: "36px"
  next-action-card:
    backgroundColor: "{colors.block}"
    textColor: "{colors.block-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.md}"
    padding: "22px"
  next-action-primary:
    backgroundColor: "{colors.block-ink}"
    textColor: "{colors.block}"
    rounded: "{rounded.sm}"
    height: "44px"
  nav-destination-active:
    backgroundColor: "{colors.block}"
    textColor: "{colors.block-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "44px"
  nav-capture-outlined:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.sm}"
    height: "44px"
  tab-add:
    backgroundColor: "{colors.block}"
    textColor: "{colors.block-ink}"
    rounded: "{rounded.md}"
    size: "52px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  tag-emphasis:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
    height: "36px"
  pill-selected:
    backgroundColor: "{colors.cobalt-soft}"
    textColor: "{colors.cobalt}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "11px 13px"
    height: "44px"
  progress-bar:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.pill}"
    height: "8px"
  segbar:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.pill}"
    height: "10px"
  segbar-thin:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.pill}"
    height: "6px"
  next-milestone-card:
    backgroundColor: "{colors.block}"
    textColor: "{colors.block-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.md}"
    padding: "22px"
  stage-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 14px"
  milestone-row:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    padding: "10px 8px"
    height: "52px"
  milestone-row-hover:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.xs}"
  weight-chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.xs}"
    padding: "0 5px"
    height: "22px"
  criteria-segment:
    backgroundColor: "{colors.surface-2}"
    rounded: "3px"
    height: "6px"
  criteria-segment-met:
    backgroundColor: "{colors.cobalt}"
  tick:
    backgroundColor: "{colors.surface}"
    rounded: "8px"
    size: "26px"
  tick-on:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.block-ink}"
  side-panel:
    backgroundColor: "{colors.surface}"
    width: "420px"
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: "11px 14px"
  toast-icon-ok:
    backgroundColor: "{colors.cobalt-soft}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.pill}"
    size: "28px"
  toast-icon-info:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    size: "28px"
  toast-icon-milestone:
    backgroundColor: "{colors.milestone-soft}"
    textColor: "{colors.milestone-ink}"
    rounded: "{rounded.pill}"
    size: "28px"
  template-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
---

# Design System: Bitácora

## Overview

**Creative North Star: "The Build Instrument"**

Bitácora is an instrument for building something over months with a few hours a week. The screen answers three questions in seconds: what to do now, how far it has come, where to log. Cobalt marks what moves forward and occupies whole blocks where the focus is; everything else is quiet neutral surface on a cool white ground. There is exactly one loud thing per view, and it is always the next step: the next action on Inicio, the next milestone on a goal.

Density is calm and even: white cards with a 1 px hairline, generous 28 px gaps between sections, system type with tabular numerals, and no decoration that does not carry information. Progress is shown, not celebrated: a bar that fills from where it was, a count of active days, a streak that never punishes. A goal's progress moves only with criteria and milestones, and its bar is cut into stages so the path is legible at a glance. Amber is kept back for milestones and real achievements so that it still means something when it appears.

The world rejects the grey dashboard with a timid accent, and the narrow column pinned to the left edge. Content is always centred in its region. The product commitments that bind the visuals: system fonts only (no third-party font requests), no dark patterns (no guilt colours, no loss framing), and every number shown must be explainable.

**Key Characteristics:**
- Committed colour strategy on cool white: cobalt as solid blocks, not as a thin accent.
- One solid cobalt block per region: the next-action card (Inicio) or the next-milestone card (goal detail) in content, the active destination in navigation.
- Goal progress as a segmented bar: one track per stage, sized by the stage's milestone weight.
- Flat hairline cards with a whisper of ambient shadow; the cobalt block alone carries a deeper shadow.
- System font stack, heavy (750) tight headlines, tabular numerals for every count.
- Motion only when a value changes, and never under reduced motion.
- Light and dark follow the system with manual override; the cobalt block stays saturated in both.

## Colors

Cool, blue-leaning neutrals with a single vivid cobalt protagonist, a reserved amber, and a red that only ever means "destructive".

### Primary
- **Vivid Cobalt** (`cobalt`, dark `dark-cobalt`): action, progress and selection. Primary buttons, progress and segmented-bar fills, met criteria segments, checked task and criterion ticks, evidence level marks, the active week dot, switches, links, selected pills, the underline of the active Historia tab, the template option border on hover, focus rings, and the icon of neutral notices.
- **Cobalt Block** (`block`, dark `dark-block`): the protagonist surface. Fills the next-action card on Inicio, the next-milestone card on a goal's detail, the active navigation destination on desktop, the centre "+" in the bottom bar, and the logo mark. Text on it is `block-ink` (white) with `block-ink-2` for secondary text; outlines on it are white at 42% and hover fills and white-wash tags white at 14%; the criteria mini bar on the block uses white for met segments and white at 14% for the rest. In dark mode the block stays a saturated mid cobalt so white text keeps AA, while the text-level accent lifts to a light periwinkle.
- **Pressed Cobalt** (`cobalt-strong`): hover state of primary buttons.
- **Cobalt Wash** (`cobalt-soft`): selected pill and segmented option background, "In progress" tag, done-activity dot, toast success icon, text selection.

### Secondary
- **Milestone Amber** (`milestone` fill, `milestone-ink` text, `milestone-soft` wash; dark `dark-milestone` for both): reserved for milestones and real achievements. It appears as the amber wash with amber-ink icon on "win" activity dots, and as the vivid fill of the closed-milestone diamond (milestone rows, the milestone panel title, the close-milestone sheet title) and of the diamond in the milestone-close toast, which sits on the amber wash. The open-milestone diamond is a neutral Faint Slate outline. The vivid fill has no other licence.

### Tertiary
- **Warning Umber** (`warn` on `warn-soft`): system state that needs attention but is not an error, namely the sync chip when sync is failing and the auth notice. Not used for task priority, due dates or inactivity.
- **Destructive Red** (`danger`, dark `dark-danger`): destructive actions and errors only.

### Neutral
- **Cool White** (`bg`, dark `dark-bg`): the app ground.
- **Surface White** (`surface`, dark `dark-surface`): cards, sidebar, sheets, inputs, ghost buttons.
- **Mist** (`surface-2`, dark `dark-surface-2`): tags, bar tracks, segmented control track, hover fills, empty heatmap cells.
- **Midnight Ink** (`text`, dark `dark-text`): primary text.
- **Slate Ink** (`text-2`, dark `dark-text-2`): secondary text, metadata, inactive nav.
- **Faint Slate** (`text-3`): placeholders, chart axis labels, quiet icons (streak flame, empty-state icon).
- **Hairline** (`line`) and **Rule** (`line-2`): card borders and row dividers; input, pill and ghost-button borders.

### Data
- **Activity scale** (`viz-1` to `viz-4`): four cobalt steps for the heatmap; level 0 is Mist.
- **Project colours** (`project-*`, eight hues, each at least 3:1 on surface): used only as an 8 px dot or a bar, never as text or a fill behind text.

### Named Rules
**The One Block Rule.** Each region has at most one solid cobalt block: the next-action card on Inicio or the next-milestone card on a goal in the content, the active destination in the navigation. Anything else that needs cobalt uses it as text, outline, fill of a small control, or a wash. That is why the desktop "Registrar" is outlined.

**The Earned Amber Rule.** Amber marks milestones and real achievements, nothing else. The only amber fill is the closed-milestone diamond, and the milestone-close toast is the one toast allowed amber. High priority and past-due dates get ink weight (semibold `text` on Mist), not amber; notices are neutral surfaces with a cobalt icon.

**The No Guilt Red Rule.** Red means destructive or error. Inactivity, a broken streak or an overdue task is never red.

**The Verified Pair Rule.** Every text and graphic colour pair is checked by `node scripts/contrast.mjs` (29 pairs, AA in light and dark: 4.5:1 for text, 3:1 for bars, dots and cells). A new colour token enters only with its pair added to that script.

## Typography

**Display Font:** system UI stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** the same stack
**Label/Mono Font:** none; numerals use tabular figures from the same stack

**Character:** one family, carried by weight and tracking. Headlines are very heavy (750) and tightly tracked; body stays regular and roomy. Zero bytes of font, nothing fetched from a third party.

### Hierarchy
- **Display** (750, 27px, 1.15, -0.025em; 32px from 1024px): the next-action title in the cobalt block, the only display-size text on a screen. A compact variant drops to 19px.
- **Headline** (750, 26px, 1.2, -0.025em): the view heading (greeting, screen name), under a 13px Slate date line.
- **Numeral** (700, 26px, line-height 1, -0.02em, tabular): daily stats; the same treatment scales to 28px for the goal percentage in the progress card, 24px for tiles and 19px for records and steppers.
- **Title** (700, 18px): sheet and panel titles and the empty goal-progress title; card names use 600 at body size, milestone names 550 at body size, stage titles 650 at 15px.
- **Body** (400, 16px, 1.5): list items, activity and task titles, inputs (16px also prevents mobile zoom). Notices and prose use 14px.
- **Button** (600, 15px; small buttons 13px).
- **Meta** (400, 13px): dates, sub-lines, milestone status lines, links (600), pill text (500). The S/M/L weight chip is 11px at 700.
- **Section label** (650, 12px, 0.06em, uppercase, Slate): the heading of a home section ("Hoy", "Pendientes", "Objetivos", "Camino", "Tareas", "Evidencia" in the milestone panel). It is the section's only heading, never a line placed above another heading.

### Named Rules
**The Tabular Count Rule.** Every number that can change (counts, percentages, times, week totals) is set in tabular figures so values do not jitter as they update.

**The System Only Rule.** Only the system stack. No web fonts, no third-party font requests.

## Layout

Mobile first, one centred column with a bottom bar; the desktop gains a fixed side navigation and the content is centred in the remaining region, never pinned left.

- **Gutter** (`--sp`): 16px on mobile, 20px from 640px, 24px from 1024px.
- **Content width:** centred, max 1200px (1320px from 1728px). List and reading views (log, activity, tasks, settings, goal detail) cap at 760px, and the sync chip above them aligns to that same 760px column.
- **Rhythm:** 28px between home sections, 18px between the focus card and stats, 16px between the goal progress card and the next-milestone card, 12px between stage cards, 8px between list rows, 10px between goal cards, 16px card padding. In the quick-add sheet the groups (type, goal, milestone, when) sit 16px apart and the pills inside a group 7px apart.
- **640px (tablet):** stats become three equal columns; goal cards flow in an auto-fit grid (min 280px) that stretches to fill the row; records in three columns. Navigation is still the bottom bar.
- **620px (sheet):** below it every sheet docks to the bottom edge at full width (16px top corners only); from 620px it is centred, max 560px, with full corners.
- **1024px (rail):** a 72px icons-only rail replaces the bottom bar (native tooltips and accessible names on every icon); "Registrar" becomes a 44px outlined circle; tiles go to four columns, records to six; the toast moves to the bottom right; detail sheets (the milestone panel) open as a 420px right-hand panel.
- **1200px (sidebar):** a 240px sidebar with the brand, Inicio / Objetivos / Historia, the outlined "Registrar" with its `N` shortcut, and Tú pinned to the bottom.
- **Home on 1024px and up:** the next-action card and the stats run the full content width, then an 8fr / 4fr grid (28px gap): Hoy on the left, Pendientes and Proyectos on the right.
- **Touch:** interactive targets are at least 44px (`tap`); secondary controls at least 24px, with ticks extending their hit area invisibly.

## Elevation & Depth

Mostly flat, with tonal layering: surfaces sit on the cool ground separated by a 1px hairline, and the only depth cue at rest is a very soft ambient shadow. The cobalt block carries a deeper, blue-tinted shadow so it reads as the lifted surface. Overlays (sheets, toast) use the large shadow. In dark mode the same roles switch to black-based shadows.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 1px 2px rgba(15,23,51,.05), 0 4px 16px rgba(15,23,51,.05)`): cards, goal cards, selected segmented option, switch knob. Stage cards are flat (hairline only).
- **Block** (`box-shadow: 0 10px 28px rgba(15,23,51,.16)`): the next-action card, the next-milestone card and the bottom-bar "+" only.
- **Overlay** (`box-shadow: 0 12px 40px rgba(15,23,51,.18)`): sheets, side panel and toast.

### Named Rules
**The Lifted Focus Rule.** Only the cobalt block gets the block shadow. Nothing else competes with it for elevation.

## Shapes

Softly rounded, three steps plus pill: 6px for the smallest pieces, 10px for controls (buttons, inputs, nav items, segmented track, record tiles), 16px for containers (cards, stats band, sheets, toast, the "+" square). Tags, pills, chips, bars, segmented-bar tracks (3px apart, 8px minimum) and the sync chip are full pills. Criteria segments are 3px-rounded 6px bars, 3px apart; evidence level marks are 4×12px bars at 2px radius; the S/M/L weight chip is a 6px-rounded 22px chip. The milestone mark is a diamond (a square turned 45°), outlined when open and filled when closed. Ticks are 8px-rounded squares, activity dots and swatches are circles, heatmap cells are 3px-rounded squares. Borders are 1px hairlines; the desktop capture button is the one 1.5px cobalt outline. Milestone rows inside a stage card are separated by hairline dividers, never drawn as cards within the card. Empty states use a dashed 1px border instead of a card.

## Components

### Buttons
Solid, compact and legible; every button is at least 44px tall.
- **Shape:** gently rounded (10px).
- **Primary:** cobalt with white text, 10px 16px, 15px semibold, optional leading 18px icon.
- **Hover / Focus:** hover darkens to pressed cobalt; press scales to 0.975; focus is a 2px cobalt outline offset 2px.
- **Ghost:** surface with a Rule border and ink text; hover to Mist.
- **Small:** 36px tall, 13px text, for notice and secondary actions.
- **Destructive:** solid red, or red text with a red-tinted border for less final actions.
- **Link:** 13px semibold cobalt with a trailing arrow icon, used for "Ver todos", "Ver registro", "Otra".

### Chips and Tags
- **Tag:** Mist pill, 12px Slate text, optional 13px icon. The emphasis variant (high priority, past due) switches to semibold ink on the same Mist, never a warning hue.
- **Project chip:** Mist pill with the project dot, links to the project.
- **Filter pill:** 36px surface pill with a Rule border; selected is Cobalt Wash with cobalt text and a 45% cobalt border.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Surface White on the cool ground.
- **Shadow Strategy:** Ambient (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px (14px for project cards, 12px 14px for notices and tiles).
- **Notice:** a neutral card with a cobalt icon, 14px text and small ghost actions plus a dismiss icon button.

### Inputs / Fields
- **Style:** Surface White, 1px Rule border, 10px radius, 11px 13px padding, 16px text, 44px minimum; label 13px Slate above.
- **Focus:** the border gives way to a 2px cobalt outline.
- **Segmented option:** bordered strip; the checked option takes Cobalt Wash and cobalt semibold text.

### Navigation
- **Mobile and tablet:** a translucent surface bottom bar with a blur and a top hairline: Inicio · Objetivos · + · Historia · Tú (Objetivos uses the target icon: two concentric circles). Labels 11px; the active item turns cobalt and bold with a 3px cobalt indicator along the top edge. The centre "+" is a 52px solid cobalt rounded square (16px radius) with the block shadow, scaling to 0.94 on press.
- **Desktop:** a surface sidebar with a right hairline, destinations Inicio · Objetivos · Historia with Tú pinned to the bottom; a goal's detail keeps Objetivos active. Items are 44px, 10px-rounded, Slate at 550 weight; hover to Mist; the active destination is a solid cobalt block with white bold text. "Registrar" is outlined in cobalt (1.5px) with a cobalt-wash `N` key, so the active destination stays the only solid block. On the rail it collapses to a 44px outlined circle.
- **Historia tabs:** two levels that must not look alike. The primary row (Actividad / Registro) is an underline tab row: 15px semibold, 24px apart, active in cobalt with a 2px cobalt underline on a hairline. The period control (Semana / Mes / Año) is a compact segmented control: a Mist track, 32px options, the selected one a white chip with the ambient shadow.

### Next-Action Block (signature)
The focus of the home screen: a full-width solid cobalt card, 22px padding (28px 30px from 1024px). The task title is the heading itself, white Display type with no label above it. Beneath it, the reasons as white-wash tags and the project as an outlined tag with a dot and arrow (underlined on hover) that links to the project. Actions: a white button with cobalt text for the main step, outlined white ghost buttons for alternatives, and a white "Otra" link to see the next recommendation. Focus rings inside the block turn white.

### Progress Bar
An 8px Mist pill track (10px big, 6px thin) with a cobalt fill. When a keyed bar's value changes, the fill animates in width from the previous value to the new one over 400ms with `cubic-bezier(.2,.8,.2,1)`; under `prefers-reduced-motion` it jumps straight to the new value. The bar exposes `role="progressbar"` with its value. The plain bar remains for a goal's optional indicator (metric) and goals without milestones.

### Segmented Progress Bar
A goal's progress: one Mist pill track per stage, 3px apart, each track's flex equal to the stage's weight (the sum of its milestones at S 1, M 2, L 3), each filled in cobalt to that stage's progress. 10px tall in the goal progress card, 6px (thin) on goal cards. Every segment's fill animates from its previous value like the plain bar; the whole bar is one `progressbar` with the weighted total and each segment carries its stage name and percentage as a tooltip.

### Goal Progress Card
A standard card: the percentage as a 28px tabular numeral with the context line beside it in 13px Slate ("N de M etapas · X de Y hitos") and an info icon button that explains the calculation; then the segmented bar; then "N de M hitos con evidencia" and a small ghost "Registrar avance". A goal's optional indicator sits below a hairline with a thin plain bar. Without milestones the card becomes "Sin hitos todavía" with a primary "Usar una plantilla" and a ghost "Añadir hito".

### Next-Milestone Block
On a goal's detail, the next open milestone is the content region's single cobalt block, built exactly like the Next-Action Block: the milestone title is the heading in white Display type, then white-wash tags (stage, "Tamaño M", "N de M criterios"), then a white-on-cobalt criteria mini bar (max 320px), then one white primary button with the diamond icon, "Ver criterios" (or "Abrir hito" when it has no criteria).

### Path: Stage Cards and Milestone Rows
Under the "Camino" section label, each stage is a collapsible flat card (16px radius, hairline, 0 14px padding, 50px summary) with a drawn chevron, the stage title (15px, 650), a Slate "N de M hitos" count, and a single edit icon button; promoting a stage or marking it "No aplica" happens in the stage edit sheet, not on the card. The current stage opens by default; skipped stages drop to 62% opacity. Inside, milestones are 52px rows separated by hairlines: the diamond (Faint Slate outline when open, amber fill with amber-ink edge when closed), the name and a 13px status line ("N de M criterios", "Cerrado", or "Cerrado · 3/5" when closed with criteria unmet), a 64px criteria mini bar while open, and the S/M/L weight chip. Hover fills the row with Mist at a 6px radius. A cobalt "Añadir hito" link closes the stage.

### Milestone Panel
Opened from a row or the Next-Milestone Block: a 420px right-hand panel on desktop, a bottom sheet on mobile. Title with the diamond, a Slate context line (goal · stage · size), a bold tabular status ("N de M criterios", or "Cerrado con 3 de 5 criterios") over a full-width criteria bar, then the criteria as hairline-divided rows with a 26px tick (checked in cobalt), and an inline input with a small ghost "Añadir" for a new criterion. Then an "Evidencia" section label with a cobalt "Añadir" link and the evidence list: link or note icon, the item (links in underlined cobalt), and one to three cobalt level marks. The footer holds a ghost "Editar" and, on the right, the close action: primary "Cerrar hito" with the diamond only when every criterion is met (or none exist); otherwise a ghost "Cerrar igualmente". Closing with unmet criteria is allowed and stays labelled with the count.

### Close-Milestone, Evidence and Template Sheets
- **Close milestone:** a sheet titled with the filled diamond; one line stating how it will close ("Cumpliste los 5 criterios." or "Se cerrará con 3 de 5 criterios; quedará indicado así."), an optional link and note as evidence, an optional one-line "¿Qué aprendiste?", then ghost "Ahora no" and primary "Cerrar hito".
- **Evidence form:** type as a segmented strip (Enlace / Nota / Resultado / Commit), link and title fields, and the backing level as a segmented strip 1 to 3 with a Slate note that it is informative and never blocks anything; choosing a type preselects its level.
- **Template picker:** a short Slate explanation and a list of seven template options, each a 10px-rounded surface button with a Rule border (cobalt on hover), the template name in bold and its stages in 13px Slate.

### Stats Band
A single surface band under the focus card: today's count, active days this week as `n/goal` with seven small day squares (filled cobalt when active, the current day ringed in Faint Slate), and the current streak with a quiet Faint Slate flame. The streak number stays ink; it is never tinted to create urgency.

### Feedback Toast
A surface card with the overlay shadow, 11px 14px padding, a 28px round icon, a bold 14px title and short 13px Slate lines. Three tones: ok (Cobalt Wash with a drawn cobalt check), info (Mist with a Slate info icon) and milestone (the amber-filled diamond on the amber wash), used only when a milestone closes; its lines report the progress delta and the next milestone. The toast sizes to its content (max-content) up to min(460px, 100vw − 24px). Bottom centre above the bar on mobile, bottom right on desktop. With an undo it stays 8s (3.2s otherwise) and pauses on hover; "Deshacer" is a cobalt semibold text button.

### Sheet and Panel
Below 620px a full-width bottom sheet docked to the bottom edge (16px top corners, max 92dvh, scrolls inside); from 620px centred, max 560px, with full corners. Detail sheets opened as a panel become a full-height 420px right-hand panel from 1024px with a left hairline, sliding in over 200ms.

### Quick Add
The capture sheet: a text area, then pill groups for type, goal (with the goal dot), milestone (diamond pills; up to three open milestones of the chosen goal, with the goal's next milestone preselected, plus "Sin hito") and when ("Ahora", "Ayer"), followed by a "Qué aprendí" pill that adds a one-line learning field. Groups sit 16px apart, pills 7px apart; selected pills take Cobalt Wash. The "Enter para guardar" hint shows only on devices that hover; touch devices hide it.

## Do's and Don'ts

### Do:
- **Do** give the next step a solid cobalt block (`block`) with white text, and keep it the only solid block in its region.
- **Do** use cobalt as text, outline, small-control fill or wash (`cobalt-soft`) everywhere else.
- **Do** mark high priority and past-due dates with ink weight on Mist, not a colour.
- **Do** keep amber for milestones and real achievements.
- **Do** set every changing number in tabular figures and animate progress from its previous value (400ms, `cubic-bezier(.2,.8,.2,1)`), off under reduced motion.
- **Do** centre content in its region: 1200px max (1320px from 1728px), 760px for list and reading views.
- **Do** run `node scripts/contrast.mjs` after touching any colour token, and add the pair for any new one.
- **Do** keep touch targets at 44px or more.
- **Do** show a goal's progress as the segmented bar (one track per stage, flex = stage weight) and move it only with criteria and milestones.
- **Do** render milestones inside a stage card as hairline-divided rows with the diamond, name, status line, criteria mini bar and weight chip.
- **Do** make "Cerrar hito" primary only when every criterion is met or none exist; otherwise offer a ghost "Cerrar igualmente" and label the result "Cerrado con N de M".

### Don't:
- **Don't** place a second solid cobalt block next to the focus card or the active destination; the desktop "Registrar" stays outlined.
- **Don't** use amber for priority, deadlines, notices or streaks, and don't fill amber anywhere but the closed-milestone diamond and the milestone-close toast icon.
- **Don't** nest cards inside the stage card, or put stage actions other than edit on the card itself.
- **Don't** use red for inactivity, missed days or overdue work; red is only for destructive actions and errors.
- **Don't** load web fonts or any third-party font.
- **Don't** pin the content column to the left or narrow the home view to a single reading column on desktop.
- **Don't** use project colours as text or as a fill behind text; they are dots and bars.
- **Don't** add celebratory motion (confetti, bursts, pulsing); motion only reports a value that changed.
