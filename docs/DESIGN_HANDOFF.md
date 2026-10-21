# Handoff Spec: polis (Présidentielle 2027)

Source of truth: the code on `main` (after PR #2, "native iOS style"). Values below are read from `app/globals.css`, `components/ui.tsx`, `components/Sheet.tsx` and the screens. When this doc and the code disagree, fix one of them in the same PR.

## Overview

polis is a mobile-first web app for French and international students (18–24) to understand the 2027 French presidential election in short sessions (about 5 minutes). Core loop: read short, sourced news cards from every political side → answer a quick challenge every 3 cards → earn *voix* → grow a city → challenge friends. It must feel like a native iPhone app, neutral (no party colours) and never tell anyone who to vote for.

Users mostly arrive from a link on their phone (WhatsApp, Instagram, a QR code on campus), one-handed, often for less than 10 minutes. That is why everything is one column, with large tap targets and primary actions at the bottom.

## Layout

| Rule | Value | Why |
|---|---|---|
| Content column | `max-w-md` (448px), centred, `px-4` (16px) gutters | Phone-first; on desktop it stays a phone-width column |
| Page wrapper | `<Page>`: `flex-col gap-5` (20px), `pt-5` (20px), `pb-10` (40px) | Same rhythm on every screen |
| Top bar | sticky, `h-14` (56px) + `env(safe-area-inset-top)` | Notch-safe |
| Bottom nav | fixed, `h-13` (52px) + `env(safe-area-inset-bottom)`, 4 tabs | Thumb reach |
| Bottom sheets | full width up to `max-w-md`, `max-h-[88dvh]`, scroll inside | Native sheet pattern |
| Feed | full-height vertical snap scroll, one card per screen, `pr-[4.25rem]` to leave room for the arrows | Story-like reading |

There is no tablet or desktop layout: the same column is used at every width. The only width-based change is in the top bar (see Responsive).

## Design Tokens Used

Colours are CSS variables on `:root`, exposed to Tailwind as `bg-*`, `text-*`, `border-*`. Dark values apply with `prefers-color-scheme: dark`; there is no in-app theme switch.

| Token (Tailwind) | Light | Dark | Usage |
|---|---|---|---|
| `paper` | `#f5f6fa` | `#05060d` | App background (white with a hint of blue) |
| `card` | `#ffffff` | `#141829` | Cards, sheets, bottom nav |
| `ink` | `#161a33` | `#f3f4fa` | Main text; sheet backdrop at 40% (`bg-ink/40`) |
| `muted` | `#646b80` | `#9aa0b5` | Secondary text, inactive tabs |
| `line` | `#e2e5ef` | `#2b3047` | Hairlines, progress track |
| `fill` | `rgba(37,70,224,.07)` | `rgba(110,139,255,.14)` | Secondary buttons, chips, icon buttons |
| `hero` | `#0b1f5c` | `#0f2470` | Navy blocks (home, end of feed, level result). Text on it is always white |
| `accent` | `#2546e0` | `#7d97ff` | Blue: primary buttons, links, active tab, progress, voix |
| `accent-ink` | `#ffffff` | `#0a0f2e` | Text on `accent` |
| `accent-soft` | `#e9eeff` | `#1a2456` | Topic band on cards, voix pill, selected chips |
| `rouge` | `#e1000f` | `#ff4d57` | Red accent. On a `bg-hero` block, `bg-accent` turns red and `text-accent` turns light red (`--rouge-light`, `#ff6b72`): countdowns, kickers, buttons. Also the tricolour stripe under the top bar and the city's flags |
| `ok` / `ok-soft` | `#18753c` / `#e6f4ea` | `#30d158` / `#0f2e18` | Right answer, "Facile" badge |
| `bad` / `bad-soft` | `#ce0500` / `#ffe9e9` | `#ff453a` / `#3a1412` | Wrong answer, "Difficile" badge, delete |

Palette (2026-10-21): bleu, blanc, rouge in institutional tones, the national colours rather than any party's. Blue carries the actions, red stays an accent on navy blocks so it never looks like an error.

**Never** use red, blue, pink, green or purple to represent a political side. Sides are shown with a neutral chip (`bg-fill`, `text-muted`) plus an icon: `‹` gauche, `●` centre, `›` droite, `»` extrême droite, `ⓘ` neutre. Greens are allowed only for trees in the city and for right/wrong feedback.

### Typography

System font stack (SF Pro on Apple devices): `--font-sans` for text, `--font-display` (`.font-display`, tracking −0.025em) for headings. Body tracking −0.01em.

| Role | Classes | Size / weight |
|---|---|---|
| Hero title | `font-display text-[2.6rem] font-extrabold leading-[1]` | 41.6px / 800 |
| Page title | `font-display text-4xl font-extrabold leading-none` | 36px / 800 |
| Section / sheet title | `font-display text-2xl font-bold` | 24px / 700 |
| News card title | `font-display text-[26px] font-bold leading-[1.15]` | 26px / 700 |
| Question | `font-display text-2xl font-bold leading-snug` (quick challenge: `text-[22px]`) | 24 / 22px |
| Body | `text-[17px] leading-relaxed` | 17px (iOS body) |
| Secondary | `text-[15px]` / `text-sm` | 15 / 14px |
| Eyebrow label | `text-sm font-bold uppercase tracking-wider text-accent` | 14px / 700 |
| Tab label | `text-[10px] font-medium` | 10px (iOS tab bar) |
| Numbers (score, voix, counters) | add `tabular-nums` | — |

### Radius, elevation, spacing

| Token | Value | Usage |
|---|---|---|
| `rounded-[14px]` | 14px | Buttons |
| `rounded-[22px]` | 22px | `<Card>`, news card |
| `rounded-[2rem]` | 32px | Hero cards, sheets (top corners) |
| `rounded-[14px]` (options) / `rounded-2xl` | 14px / 16px | Answer options / inner boxes ("Pour toi", sides) |
| `rounded-full` | — | Chips, pills, icon buttons |
| Card shadow | `0 8px 30px rgba(0,0,0,.06)` | News card only; other cards are flat on `paper` |
| Floating arrow shadow | `0 4px 16px rgba(0,0,0,.12)` | Feed up arrow |
| Spacing | Tailwind scale: `gap-2` 8px inside groups, `gap-3` 12px in lists, `gap-5` 20px between sections, `p-5` 20px card padding | — |

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| `Button` / `ButtonLink` (`components/ui.tsx`) | `primary` | `variant`, native button/link props | `min-h-[50px]`, full width, 17px semibold, `bg-accent text-accent-ink`. Pressed: `opacity-70`. Disabled: `opacity-40` |
| | `secondary` | | `bg-fill text-accent` |
| | `ghost` | | Text only, `text-accent` |
| `Card` | — | `className` | `rounded-[22px] bg-card p-5`, no border |
| `SourceLink` | — | `label`, `url` | Opens in a new tab with `rel="noopener noreferrer"`; every fact must have one |
| `Page` | — | `className` | Column wrapper (see Layout) |
| `Sheet` (`components/Sheet.tsx`) | — | `onClose`, `labelledBy` | Bottom sheet: grabber, drag down 90px to close, backdrop tap, Escape. Locks body scroll and focuses the panel on open |
| `TopBar` | root / sub-page | — | Back chevron (`text-accent`) only on sub-pages (`ROOTS` list), polis logo (`Logo h-7`), FR/EN pill, voix pill → `/ma-ville` |
| `BottomNav` | — | — | Actu / Défis / Ma ville / Profil. Hidden on `/`, `/bienvenue`, `/stats`. Active = `text-accent` |
| `Logo` | light / `onDark` / `mark` | `className`, `onDark`, `mark` | Shows the black file, and the `-white` file in dark mode. Use `onDark` on `hero` cards |
| `City` | static / `interactive` | `voix`, `label`, `interactive`, `selected`, `onSelect` | SVG scene 360×200. Has its own fixed daylight palette in both themes (it is an illustration and must export to PNG) |
| `ChallengePlayer` | 5 challenge types | `type`, `mode`, `level`, `fixedIds`, `items`, `refChallenge`, `match` | One question per screen + feedback block |
| `InlineChallenge` | — | `readCards`, `used`, `onContinue` | "⚡ Défi rapide" inside the feed, every 3 cards |
| `ShareSheet` | challenge / city | `message`, `url`, `challengeType`, `code` | Web Share (if available), WhatsApp, Copy link; 3-step explanation for challenges |
| `LevelUp` | — | — | Overlay when the city reaches a new level |
| `EmailCapture` | idle / sending / done / error | — | Consent checkbox is required before the button enables. Email prefilled from the account |

## States and Interactions

| Element | State | Behavior |
|---|---|---|
| Any button | Pressed | `opacity-70` (`active:`), no scale. iOS-like |
| Any button | Disabled | `opacity-40`, not focusable by tap |
| Answer option | Default | `rounded-[14px] border-2`, `min-h-14` (56px), 17px medium; pressed `scale-[0.99]`. Pronostics options: `bg-fill`, no border |
| Answer option | Right (after answer) | `border-ok bg-ok-soft`, ✓, `bump` if it was the one tapped, haptic "success" |
| Answer option | Wrong (tapped) | `border-bad bg-bad-soft`, `shake`, haptic "fail"; the right option turns green |
| Answer option | Others after answer | `opacity-60`, disabled |
| Feedback block | After every answer | ✓ Bien vu ! / ✗ Raté · the right answer (if wrong) · "Pourquoi" · source · "Question suivante" (autofocus). **Never auto-advance**: testers asked to always see why |
| Streak | 2+ right in a row | 🔥 ×n pill in the header; from 3 in a row, +5 voix bonus line in the feedback |
| Vrai ou Faux card | Drag | Follows the finger, rotates `dx/18`°; "Vrai"/"Faux" label from 40px; commits at ±80px; else springs back (0.3s ease) |
| Feed reaction 👍 / 👎 | Selected | `border-accent bg-accent-soft text-accent`; can be changed; sent anonymously |
| Feed arrows | First / last card | Up disabled on the first section, down disabled at the end (`opacity-30`) |
| Feed "Ce que dit chaque camp" | Closed / open | Native `<details>`, chevron rotates 180° |
| Hub level picker | Selected | iOS segmented control: track `bg-fill`, segments `min-h-8 rounded-[9px] text-[13px] font-semibold`; selected segment is raised: `bg-card text-ink` + shadow `0 3px 8px rgba(0,0,0,.12), 0 3px 1px rgba(0,0,0,.04)`. Choice saved in `localStorage` (`p27.levelChoice`) |
| Hub "Défier un ami" | Toggled | Block turns `bg-accent`; challenge list keeps only friend-compatible challenges; tapping one starts it in friend mode directly |
| City building | Built | Pulsing accent dot; tap → sheet: "Qui décide ?", "Pour toi", source; haptic "tap" |
| City building | Locked | Dashed outline + 🔒; tap → sheet with the level and voix still needed + "Gagner des voix" |
| Voix pill (top bar) | Gain | `+N voix` floats up (1.2s), number `bump`s |
| Email form | Error | Inline `text-bad` message under the field, form stays filled |
| Onboarding step | Any | Back chevron, progress bar, "Tout passer" (jumps to result, shown after the account step), "Passer" per step |
| Onboarding account step | Sending / error | "Créer mon compte" disabled until the email is valid; "Création…" while sending; inline `text-bad` message on error, form stays filled |

There are no hover-only interactions: every hover state must also work on tap.

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| < 400px | Top bar shows only the logo (the "Présidentielle 2027" caption is hidden: `min-[400px]:inline`) |
| ≥ 400px | Caption next to the logo |
| ≥ 448px (`max-w-md`) | Column stops growing, centred on `paper` |
| `sm` (≥ 640px) | City on "Ma ville" stops scrolling sideways (`w-[170%]` → `sm:w-full`) |
| Landscape phone | No special layout; the feed snap still works because heights use `dvh` |

Everything uses `env(safe-area-inset-*)` so it works as a home-screen web app on iPhone.

## Edge Cases

- **No profile yet**: `/feed` shows a hero card "Une minute pour l'adapter à toi ?" with "Faire mon profil" / "Continuer sans profil". Without a profile the level is "débutant".
- **International player** (`voter` = eu / non-eu / nsp): no registration card; the 3 "intl" cards come first.
- **Empty city history**: "Pas encore de voix. Lis une actu pour poser ta première pierre." with a link to the feed.
- **No result in session** (e.g. the result URL is opened directly): Card "Pas encore de résultat" + "Voir les défis".
- **Challenge link with an unknown or deleted code**: friend landing shows "Un·e ami·e t'a défié·e…" without score, and "Relever le défi" goes to the hub.
- **Long text**:
  - First names are capped at 20 characters and team names at 30 (input `maxLength` and server).
  - News titles are written ≤ 60 characters. Long card bodies scroll inside the snap section (`overflow-y-auto` + `my-auto`), so nothing is cut off.
  - The top-bar caption `truncate`s. Team names in the match panel `truncate`.
- **English strings are longer** (e.g. "Challenge a friend" vs "Défier un ami"): buttons are full width and wrap, segmented control labels fit at 4 columns down to 320px; keep labels ≤ 12 characters there.
- **Slow connection / no database**: challenges still play; the share code falls back to a locally generated code (friend links then show no score). Saving an email shows the error message. Team mode shows "Le match n'a pas pu être créé…".
- **Loading**: pages render an empty `<main>` until client data is ready (≤ 1 frame on a normal phone). Async actions show text, not spinners: "Calcul du score…", "Envoi…", "Création…", "Connexion…", "Chargement du défi…".
- **Storage blocked** (private mode): everything works for the session in memory; nothing is kept after closing.

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Sheet panel | Open | Slide up from 100% (`sheet-in`) | 320ms | `cubic-bezier(.32,.72,0,1)` |
| Sheet backdrop | Open | Fade in | 200ms | ease-out |
| Sheet panel | Drag release < 90px | Spring back | 250ms | `cubic-bezier(.32,.72,0,1)` |
| Cards, feedback, overlays | Appear | `pop`: scale .9 → 1 + fade | 250ms | ease-out |
| Wrong option | Answer | `shake` ±6px | 350ms | ease-in-out |
| Right option, streak pill, voix number | Answer / gain | `bump` scale 1.06 | 300ms | ease-out |
| "+N voix" | Gain | Float up 22px and fade | 1.2s | ease-out |
| City buildings and trees | Mount / level up | `grow` scaleY 0 → 1 from the bottom, staggered 90ms per level | 700ms | `cubic-bezier(.2,.8,.2,1.2)` |
| City clouds | Always | Drift 82px back and forth | 90s | ease-in-out, alternate |
| City birds | Always | Cross the sky | 22s | linear, infinite |
| Built building dot | Always | Radius 3 → 4.5 | 1.6s | SVG animate, infinite |
| Feed hint arrow | First card | `animate-bounce` | Tailwind default | — |
| Feed scroll | Arrow tap / keyboard | `scrollIntoView` smooth | Browser default | — |
| Haptics | Answer / tap / level up | `navigator.vibrate` patterns in `lib/feedback.ts` (Android only, iOS ignores) | — | — |

`prefers-reduced-motion: reduce` turns all animations and transitions off (0.01ms), stops clouds and birds, and skips haptics.

## Accessibility Notes

- **Focus order**: top bar (back, logo, FR/EN, voix) → page content top to bottom → bottom nav. In the feed: header (progress, info) → current card → reactions → arrows.
- **Focus ring**: `:focus-visible` 3px `accent` outline, 2px offset, everywhere. Never remove it.
- **Sheets**: `role="dialog" aria-modal="true" aria-labelledby`, focus moves to the panel, Escape closes, body scroll locked. Close buttons have `aria-label` "Fermer" / "Close".
- **Feedback** is announced: feedback block has `role="status" aria-live="polite"`; feed counter `aria-live="polite"`.
- **Buttons with icons only** have `aria-label`: back, FR/EN ("Switch to English" / "Passer en français"), info, previous/next card, close.
- **Toggles** use `aria-pressed` (topics, reactions, level segments, onboarding choices, friend mode); the current tab uses `aria-current="page"`.
- **City**: the SVG has `role="img"` + label; in explore mode each building is a `role="button"` with `tabIndex=0`, Enter/Space to open, label "La mairie (à débloquer)". The building list under the city is the accessible alternative.
- **Keyboard**: feed ↑/↓ arrow keys move between cards; Vrai ou Faux has real buttons besides swipe; every drag (sheet, card) has a button alternative.
- **Colour is never the only signal**: right/wrong also use ✓/✗ and text; sides use icons + labels; difficulty badges have text.
- **Contrast**: `muted` on `paper` is the minimum text pair; don't put `muted` text on `fill`.
- **Language**: `<html lang>` follows the FR/EN switch.
- **Tap targets**: ≥ 44px everywhere (buttons 50px, options 56px, icon buttons 44–48px). The voix and FR/EN pills are 32px tall but sit inside a 56px bar; don't make them smaller.

## Known issues to fix

1. **Feed height uses the old nav height.** The feed scroller subtracts `4.25rem` for the bottom nav, but the nav is now `3.25rem` (`h-13`). That leaves a 16px gap under the feed. Fix: replace `4.25rem` with `3.25rem` in `app/feed/FeedClient.tsx`.
2. **Same problem on the result page.** The sticky "Défie un·e ami·e" button sits at `bottom: 4.25rem`, 16px above the nav. Fix it in `app/defis/[type]/resultat/ResultClient.tsx`.
3. **Not every sheet uses `<Sheet>` yet.** The feed `InfoSheet` and the challenges-hub mode picker still use their own overlay (`pop`, `bg-ink/50`). Only `ShareSheet` and the city building sheet use `<Sheet>`. Switch the other two so all sheets slide and drag the same way.
4. **`SourceLink` label.** It renders "Source : …" with the French space before the colon in English too. Make it `t("Source :", "Source:")`.
5. **No vector logo.** The logo files are raster (PNG from JPEG PDFs). Ask the designer for SVGs before using the logo larger than 64px.
