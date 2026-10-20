# Présidentielle 2027 : le jeu

Round 1 MVP. It tests one assumption: **students want to learn about the 2027 campaign through a short game** (Test Card v2, pass threshold: at least 40 % of testers finish at least one challenge, mini-quiz included). The share rate is still measured as a secondary metric.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4, Supabase (free tier, only through API routes), Vercel (free).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill it in (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase variables the app still runs: you can read the feed, play every solo challenge and grow your city. Nothing is saved on the server. Friend links, team matches and `/stats` need Supabase.

## Set up Supabase (10 minutes)

1. Create a free project at <https://supabase.com>.
2. In **SQL Editor > New query**, paste `supabase/schema.sql` and click **Run**.
3. In **Project Settings > API**, copy the **Project URL** into `SUPABASE_URL` and the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`.

Row Level Security is on for every table, with no policy. The browser never talks to Supabase: every read and write goes through `app/api/*` with the service key. This is stricter than "anon can insert", and it means `emails`, `events` and `predictions` can never be read from the client.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. On <https://vercel.com/new>, import the repository (framework: Next.js, no build settings to change).
3. Add the 4 environment variables: `NEXT_PUBLIC_SITE_URL` (the Vercel URL, e.g. `https://presidentielle-2027.vercel.app`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STATS_PASSWORD`.
4. Deploy. If you change `NEXT_PUBLIC_SITE_URL` later, redeploy (it is baked in at build time).

## Edit the content (no code)

Everything players read lives in `content/*.json`. Edit, commit, and Vercel redeploys.

| File | What |
|---|---|
| `content/actu.json` | **Current news cards** (the main feed). `camp`: `neutre`, `gauche`, `centre`, `droite`, `extreme-droite`. `topic`: an id from `topics.json`. Optional `why`, `sides`, `quiz` (used by the mini-quiz). |
| `content/feed.json` | "Les bases" cards (`kind: "bases"`, shown depending on the level) and a few candidate cards (`kind: "actu"`). |
| `content/topics.json` | Topics (label + emoji) and the camp labels. |
| `content/onboarding.json` | Profile questions, the 3-question level test, level texts, the political-position question text. |
| `content/city.json` | Buildings of the city: what each one does, who decides, "pour toi", source, and its tap area. |
| `content/quiz.json` | The 3 mini-quiz questions (`answer` = index of the right option, starting at 0). |
| `content/vrai-faux.json` | Vrai ou Faux statements (`answer`: `true` = Vrai). |
| `content/qui-propose.json` | Qui propose ça ? (`answer` = index; options are shuffled on screen). |
| `content/autre-camp.json` | Défends l'autre camp topics: one argument `pour`, one `contre`, one `offTopic` and its correction. |
| `content/pronostics.json` | Prediction questions. |
| `content/levels.json` | City levels and the level-up messages. |
| `content/defis.json` | Hub cards, durations, modes, result lines. |
| `content/site.json` | App name and the **team contact email shown on the privacy page (to fill in)**. |

**Editorial rules:** facts only, a source for every item, as many items about the left as about the right/centre, nothing still uncertain. **Re-check every card the day before testing.**

## How each test-card metric is measured

- `?t=T03` on any link tags the session for an in-person test.
- **Completion rate (primary, Test Card v2, pass ≥ 40 %):** sessions with at least one `challenge_finish` (the mini-quiz after the feed counts) ÷ sessions that opened the app. When some sessions have a `?t=` tag, `/stats` computes it on tagged testers only and also shows the rate for everyone.
- **Share rate (secondary, former Test Card v1, ≥ 40 %):** sessions with at least one `challenge_finish` **and** at least one `share_click`, ÷ sessions with at least one `challenge_finish`.
- **Proof of a real send:** `friend_landing_view` and `friend_finish` per challenge code. A friend who plays creates a `challenges` row whose `ref_code` points to the original code.
- `/stats` (password = `STATS_PASSWORD`) shows everything, with a CSV export of sessions.

## Profile and personalised feed

- `/bienvenue` (6 steps, back arrow on each): first name, habits (follows the news, voted, registered), a 3-question level test, topics, political position (optional), result.
- Level = right answers in the test + how often they follow the news → débutant / intermédiaire / avancé. Beginners get the "bases" cards first; advanced players go straight to the news. Not registered (or not sure) → the registration card comes first.
- Feed rule (`lib/feed.ts`): camps take turns (gauche, centre, droite, extrême droite) with a neutral card after every 2; the player's topics first inside each camp; 👍 on a camp → the next cards come from the camps with the fewest 👍; if the player gave a position, the camps farthest from it come first. Nothing is ever hidden: every camp is always shown.
- **The political position never leaves the phone**: it is not in any event, and the server strips `position`, `ideas`, `leaning`, `opinion`, `side`, `pour`, `contre` from every event.

## Round 2 changes (after the first tests)

- **Answers always explained**: after every answer (all challenges), the player sees right/wrong, the right answer, why, and the source, then taps "Question suivante".
- **Difficulty**: every question has `difficulty` 1 (easy), 2 (medium) or 3 (hard). In the challenges page the player picks Progressif (default: starts easy, +1 level after 2 right answers in a row, −1 after a mistake), Facile, Moyen or Difficile. Logic in `lib/difficulty.ts`. A friend's link replays exactly the same questions (`item_ids` in `challenges`); team matches use the same questions for everybody (easiest first).
- **Onboarding** (`/bienvenue`): name, "can you vote in France?", habits, optional level test, topics, a 3-screen tutorial, result. Every step can be skipped ("Passer" / "Tout passer"). The left–right position moved to the profile (optional, stays on the phone).
- **International mode**: players who can't vote at the presidential election (EU / non-EU / not sure) get the "qui peut voter / pourquoi ça te concerne / élections étudiantes" cards (`audience: "intl"` in `feed.json`) and no registration reminders.
- **English version**: FR/EN switch in the top bar and in the profile; default = browser language. UI strings are written inline as `t("français", "English")` (`lib/i18n.ts`); content translations live in `content/en/overlay.json`, matched by id (anything missing falls back to French).
- **Multiplayer**: a "Joue avec un ami" block explains the 3 steps in the challenges page, the share sheet and the friend's landing page.

## Privacy choices

- The Pour / Contre answer in "Défends l'autre camp" stays in the component state: never stored, never sent. The server also strips `opinion`, `side`, `position`, `pour` and `contre` keys from any event.
- Feed 👍 / 👎 (`feed_reaction`) are stored **without session id or tester tag**: likes per camp can be counted, but never linked to a player.
- Email only with the consent box ticked. First name optional. No cookies, no third-party trackers (only `localStorage`).

## Implementation choices not written in the spec

- `challenges` and `match_players` have an extra `total` column (to show "6/8").
- "Your team wins a match" (+50 voix) is granted when both teams have at least 2 finished players and your team's average is strictly higher, once per match.
- "A friend plays your challenge" (+50 voix) is checked each time the app opens.
- If a page is reloaded, the last result is kept for the tab only (`sessionStorage`).

## Project structure

```
app/                 pages and API routes (see the spec, section 12)
components/          City (SVG), ChallengePlayer (the 5 challenge engines), ShareSheet, EmailCapture, TopBar, LevelUp
lib/                 content loader, voix rules + storage, feed rule, tracking, API client
lib/server/db.ts     Supabase (service key, server only)
content/*.json       all editable content
supabase/schema.sql  tables + RLS
```

## Working as a team

- The repository is connected to Vercel: **every push to `main` redeploys https://presidentielle-2027-theta.vercel.app automatically** (about 1 minute). Check the result in the Vercel dashboard or on the commit's status on GitHub.
- Run `npm run build` before pushing: if the build fails locally, the deploy fails too and the live site keeps the previous version.
- To try a change without touching the live site, push to another branch (`git checkout -b my-change`): Vercel creates a separate preview link for it.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STATS_PASSWORD`) live in Vercel and in each person's `.env.local`. Never commit them.
