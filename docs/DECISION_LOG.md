# Decision Log

_Last updated: 2026-10-20 — Stage: Discovery (round 1)_

## Context learned (2026-10-20, from course deck "Innovation Process & Ideas, AIDAMS 2026-2027")
- The project is a **3-day course** (ESSEC Cergy): Day 1 problem, Day 2 build the MVP (10:45–12:30) and test it with 10+ real users, Day 3 traction, pitch video and essay.
- Grading rewards **decisions backed by evidence** (the evidence log), not polish. Only real users count: no AIDAMS students, and at most 30% people the team already knew.
- The deck's rule: test the **riskiest assumption first**, meaning the one that kills the project if it is wrong. Categories: want it / can use it / can deliver it / will pay. Write the pass threshold before testing.
- Tarpit warning in the deck matches our data: users who will never pay (5 of 7).
- Consequence: a full PRD is out of scope for the course. Focus on a Test Card and a very small MVP.

## Ideas under consideration
- **Feed + friend challenge + quiz coins to "build" something** (parliament or city). Proposed by the team on 2026-10-20. Under evaluation.

## Decisions made
| Date | Decision | Why |
|---|---|---|
| 2026-10-20 | The coins are virtual, never real money | Real money would buy participation and make the test meaningless |
| 2026-10-20 | Players build a **city**, not a parliament | Concrete, everyday topics drive engagement (local-politics quote). A parliament is abstract and risks partisan seat-filling |
| 2026-10-20 | Day 2 MVP = "Quartier": 5 cards on rent + 3-question quiz + city + friend challenge + next-topic vote/email (`mvp/quartier.html`) | Tests the riskiest assumption, "they want it", by measuring behaviour |
| 2026-10-20 | No news feed in the MVP | Not differentiated (TikTok and HugoDécrypte already do it) and the team can't produce daily neutral news |

## Test Card, round 1 (draft; the team should confirm the thresholds before testing)
- **We believe** students who spend under 10 minutes on politics will engage with a short political topic when it's a quiz they can send to a friend and that builds their city.
- **To verify**, 5+ real students (not AIDAMS) use Quartier on the team's phone, with the game layer on.
- **Measure**: finished session; tapped WhatsApp, copy or QR to challenge; left an email; topics voted.
- **We are right if**: ≥3/5 finish, ≥2/5 send a challenge, ≥2/5 leave an email.
- **Round 2 idea**: game layer off (facilitator toggle) to see whether coins and the city change the numbers.

## Working assumptions (unconfirmed, to be accepted or rejected)
| # | Assumption | Basis | Status |
|---|-----------|-------|--------|
| A1 | Primary segment: French-citizen university students aged 18–24 who live away from their family and intend to vote but spend little time getting informed | Interviews 2, 4, 8 plus the persona; Ipsos BVA 2026 (8 in 10 young people plan to vote) | Proposed |
| A2 | The 2027 presidential election (1st round 18 Apr 2027; registration deadline 12 Mar 2027) is the main real-world test window | info.gouv.fr | Fact; its relevance to the project still needs confirming |
| A3 | Users accept roughly 10 minutes per session, so the product is designed for short sessions rather than trying to stretch them | Interview quote (n=1), consistent with event-driven behaviour | Hypothesis |
| A4 | Everyday-life issues (rent, jobs, cost of living) are the entry point that makes politics feel relevant | Local-elections quote (n=1); Ipsos top concerns | Hypothesis, the strongest one |
| A5 | No paid B2C model. Free for users; any funding comes from institutions | 5 of 7 respondents unwilling to pay | Strong signal |
| A6 | The product never recommends a candidate or party and never infers a user's political leaning | Brief, Part 10 | Non-negotiable principle |

## Evidence corrections
- Two of the three cited sources (Public Sénat and L'Étudiant) report the **same** Ipsos BVA survey (n=3,030 people aged 18–29, fieldwork July–Aug 2026). It covers young people in general, not students specifically.
- Total students in 2025–26 = 3,049,600 (SIES note flash 2026-17). The pain sizing multiplies youth-survey percentages by student counts and assumes "1 election per year". Both steps are unsupported.

## Open questions (round 1)
See the questions at the end of the round 1 analysis: deadline/ambition, scope, team skills/budget, editorial capacity, role of AI, target segment, language/platform.

## Rejected ideas
_None yet._

## 2026-10-20 (later): switch to the team's own spec
| Date | Decision | Why |
|---|---|---|
| 2026-10-20 | **Quartier (rent MVP) rejected** by the team | The team preferred its own concept |
| 2026-10-20 | Build "Présidentielle 2027 : le jeu" from the team's MVP Blueprint (`presidentielle-2027/`) | Riskiest assumption: students want to learn the 2027 campaign through a game and like it enough to challenge friends. Pass threshold: ≥4/10 send a challenge |
| 2026-10-20 | Feed 👍/👎 stored **without** session id (deviation from spec §10) | Reactions per camp linked to a person could reveal political leaning (RGPD art. 9). Per-camp counts still available |
| 2026-10-20 | Supabase RLS on with no anon policy (stricter than spec) | All access goes through API routes with the service key |

### Open content issues (to fix before testing)
- Glucksmann primary (11 Oct 2026) is sourced to a France 24 article dated 24 May 2026, which can't contain that result. Find a source dated after 11 Oct.
- Feed balance: 3 left cards vs 2 centre + 2 right.
- "56 %" purchasing-power figure and the left/right summaries on card 12: unverified.
- Défends l'autre camp sources (vie-publique home page, service-public F2300 / F23567): check them.
- `content/site.json` contactEmail is a placeholder.

## 2026-10-20 (evening): team feedback round
| Decision | Why |
|---|---|
| Feed = 24 verified news cards (actu.json, 2 Sept–18 Oct 2026) + basics by level; 4 blocs (gauche, centre, droite, extrême droite) + neutral, rotated | Team asked for real current news "from every side" and a longer feed |
| Onboarding: habits, 3-question level test, topics, optional left–right position | Team asked to "see the level of the person" and their current ideas |
| Position stays on the device only, used only to start with the farthest camps; never filters out any camp | Political opinion = sensitive data (RGPD art. 9); the product must not steer votes |
| Bottom nav (Actu / Défis / Ma ville / Profil), back arrows, ↑↓ arrows in feed | "Go back and see your ville easily", "make the scrolling clear" |
| City buildings are tappable: what each institution does, who decides, what it means for a student | "You should be able to click on the city and explore it" |
| All UI in French ("Vrai ou Faux", URL /defis/vrai-faux) | Team request |
| Removed the "56 %" pouvoir d'achat card | Its source gives no pollster, date or sample |
| Fixed Glucksmann source (Public Sénat, 11 Oct) and Tondelier wording (members vote 10–13 Dec) | Found by verification |

## 2026-10-20: deployed
- Public app: https://polis-2027.vercel.app (Vercel, production)
- Database: Supabase project zsqnhpvkbykyxxpfvpyc (West EU), schema from `supabase/schema.sql`, RLS on, no anon policy
- Env vars set on Vercel (production) and in `presidentielle-2027/.env.local` (git-ignored). Stats page: /stats (password shared with the team only)
- End-to-end test passed (challenge → friend reply → +50 bonus, team match, events, stats); test rows deleted

## 2026-10-20: Test Card v2 (decided by the team)
- **We believe that** students want to learn about the 2027 campaign through a short game.
- **Measure:** players who finish at least one challenge (the mini-quiz after the feed counts) ÷ players who open the app. Computed on `?t=` tagged testers when there are any.
- **We are right if:** at least 50 % (5 out of 10 testers) finish at least one challenge.
- **Why the change:** decided by the team on 2026-10-20. The share rate (v1, ≥ 40 %) is kept as a secondary metric in /stats. The course grades decisions on evidence, so log whether v2 was set before or after seeing test results.
- 2026-10-20 (later): threshold lowered by the team from 50 % to **40 %** (4 out of 10 testers). At that moment the measured rate was 26 % (5 of 19 tagged testers).

## 2026-10-20 (evening): round 2 changes, from the first test logs
| Feedback from testers | Change |
|---|---|
| Not always told the right answer and why | Every answer: right/wrong + right answer + why + source |
| Obscure facts, guess-the-candidate felt like a lottery | 12 new "Qui propose ça ?" on well-known candidates (3 per side), 16 Vrai ou Faux, 9 quiz, all re-verified (content/content-notes.md) |
| Difficulty didn't match | Difficulty 1–3 on every question; Progressif / Facile / Moyen / Difficile |
| Onboarding too direct about politics | Every step skippable, tutorial added, left–right position moved to the profile |
| Hard to understand how to play with friends | 3-step explanation in hub, share sheet, friend landing |
| Non-French speakers couldn't try it | Full English version (FR/EN switch) |
| International students can't vote but want to learn | International mode (who can vote, why it matters, student elections) |
| Nothing removed for now | Team decision |
- Next Test Card (team): at least 40% of users complete a challenge when they open the web app.

## 2026-10-20: game feel and city polish (design / game-design skills)
| Decision | Why |
|---|---|
| Answer feedback: vibration, a shake on a wrong answer, a bounce on a right one, a moving progress bar | "Juice": feedback makes each answer feel like it counts (game-design-core). Aims at the primary metric, finishing a challenge |
| Streak: from the 3rd right answer in a row, +5 voix per answer, a "🔥 ×N" badge and a line in the feedback panel (uses the round-2 streak counter) | A short reward loop inside a challenge. Small bonus, so the level thresholds stay the same |
| Fixed: a wrong answer in the mini-quiz and in Défends l'autre camp now shows in red (it stayed white) | Found while testing: `bg-card` was overriding `bg-bad-soft` |
| City decor generated from a seed (session id): clouds, birds, stars, trees on the hill. One more tree every 40 voix | Each player's city is their own and stays identical on every visit; progress is visible between two levels (procedural generation) |
| Sky follows the time of day (day / dusk / night) | A small surprise for players who come back (open-world "micro-discoveries") |
| Only the next building to unlock is highlighted (orange animated outline) + a "Prochaine découverte" card | One clear landmark to aim for instead of every locked building looking the same (open-world wayfinding) |
| Bottom sheets: slide up, grabber, drag down or Escape to close; thinner borders, translucent bars | Native iOS feel (apple-ui-designer) |
| Full iOS-style redesign: system font (SF Pro on iPhone), grouped grey background with white cards and no borders, near-black text, iOS buttons (50pt, grey-fill secondary), segmented controls, grey text fields, tab bar without pill, red delete action, dark mode in true black | The first pass was too subtle to notice. apple-ui-designer: native over custom, hierarchy by size and weight, accent used sparingly. Also removes the 2 Google Fonts downloads |
| `voix` and `profile` share one typed persisted store (`lib/store.ts`) | One data flow for all local state (Zustand-style pattern, no new dependency) |
| Not done: a daily streak / daily goal | Feature creep: it does not help the round-1 test (finish one challenge) |

## 2026-10-21: engagement features (requested by the team)
This reverses "Not done: a daily streak" above: the team asked for features that bring players back. Everything stays on the phone (`lib/progress.ts`, key `p27.progress`); only `badge_unlock` (badge id) and `origin: "daily"` on challenge events reach the server.
| Decision | Why |
|---|---|
| **Défi du jour**: 5 questions, the same for everybody on a given day (seeded by the date), type rotates Vrai ou Faux → Qui propose ça ? → Mini-quiz. +30 voix once per day. Shown first in Défis and on the home page for returning players | A reason to come back every day, and a shared reference ("j'ai fait 4/5 au défi du jour") that makes sharing natural |
| **Day streak** 🔥: days with at least one finished challenge (any kind, mini-quiz and quick challenge included). +10 voix on the first challenge of the day from 2 days in a row. "At risk" reminder when the streak isn't continued yet today | Habit loop; the bonus is small so level thresholds stay meaningful |
| **12 badges** (`content/badges.json`, editable, English in the overlay): first challenge, daily challenge, flawless, 3 and 7 days, all-rounder, every side (read a card from all 4 blocs), predictions, sent a challenge, a friend played, team match, 500 voix. Banner when one unlocks, collection in Profil | Collection goal; several badges point at the behaviours we want (play every challenge type, read every side, share) |
| **"Et maintenant ?"** on the result page: today's challenge if not done, otherwise a challenge type not played yet | The result page was a dead end ("Essayer un autre défi"); one concrete next step reduces drop-off |
| Camps read (for "Tous les bords") are stored locally only and never sent | Reading habits per camp could hint at political leaning (same rule as feed 👍/👎) |
| To measure: return rate (sessions active on 2+ days, from `events.created_at`), daily challenge starts/finishes (`origin = daily`), `badge_unlock` counts | Check whether these features change behaviour before adding more |

## 2026-10-21 (later): second round of improvements (requested by the team)
| Decision | Why |
|---|---|
| **Link preview** (`app/opengraph-image.tsx`, generated at build time) + Open Graph / Twitter metadata | Every challenge is sent on WhatsApp/Instagram; until now the link showed no image. A clear preview should raise the share → friend-plays conversion |
| **Installable app** (`app/manifest.ts`): "Add to home screen" opens polis full screen on the news | An icon on the home screen makes coming back (daily challenge, streak) one tap away |
| **Mes duels** in Défis (`/api/challenge/replies`): for each challenge I shared, my score next to every friend who answered it (first name if they gave it), "Revanche" for a new round, "Renvoyer le lien" when nobody played yet | Closes the social loop: before, a friend's play only showed up as +50 voix. No schema change. Privacy page updated |
| **"Ton avis en 10 secondes"** on the result page: 1–5 rating + optional comment (300 chars), asked once per phone, "Pas maintenant" hides it for the tab | The course grades decisions on evidence: this collects qualitative feedback from real users automatically. The server keeps only a valid rating and a cleaned comment; players are asked not to write their name or political opinion |
| **/stats → "Ils reviennent ?" and "Avis des joueurs"**: players active on 2+ days (Paris time), days played per player, daily challenge started/finished, badges unlocked, average rating and comments | Measure whether the engagement features work. Baseline on 2026-10-21, before they went live: 1 of 70 players came back another day |

## 2026-10-21 (evening): voting guide "Voter : mode d'emploi" (requested by the team)
| Decision | Why |
|---|---|
| New page `/voter` with 4 situations: French in France, French abroad, EU citizen in France, non-EU in France. Each one shows what the player can vote in, the deadlines (with a countdown) and a step-by-step checklist (ticks stay on the phone) with official links | Students don't know the administrative steps (registration, procuration, ID, consular roll). Concrete next steps turn "learning about the campaign" into "being able to vote" |
| Content in `content/guide.json` (+ English overlay), sources on every section: service-public.gouv.fr (F1367, A18967, F1361, F16828, F11257, F1604, F34852, F16904, F1937, R51788, R16396), diplomatie.gouv.fr (consular roll, internet voting), Légifrance (Code électoral L11, Constitution 88-3, Code de l'éducation L719-2), etudiant.gouv.fr (CROUS elections), Conseil constitutionnel 2022 | Every fact was checked on the official page on 2026-10-21 |
| Wording kept cautious where no official 2027 page exists: Saturday voting in the Americas is given "as in 2022, check with your consulate"; Erasmus students are told they *can* stay on their French list and vote by procuration (no official page says this in so many words, it follows from F16904 + F1604) | No unverified fact presented as certain |
| Entry points: Défis hub card, Profil ("Ma situation"), and a "Les démarches, pas à pas" button on the feed cards `inscription`, `qui-peut-voter`, `elections-etudiantes` | Players reach the guide from where the topic comes up |
| New badge "Prêt·e à voter" (whole checklist ticked) and event `guide_view` (which situation was opened, no other data) | Measure use of the guide |
| **Corrections found while checking sources**: (1) "procuration possible jusqu'à la veille" removed from 1 feed card and 2 question explanations: F1604 sets no fixed deadline and says to do it as early as possible; (2) the registration deadline is now the 6th Friday whatever the method (décret 2026-493, from 1 July 2026): 12 March 2027 stays right; (3) `qui-peut-voter` and `elections-etudiantes` cited a home page, now a precise page | Accuracy |
| Not fixed: `presidentielle-te-concerne` still cites the Campus France home page | Out of the guide's scope; to check |

## 2026-10-21 (night): account created with an email at onboarding (requested by the team)
| Decision | Why |
|---|---|
| The first onboarding step is now "Crée ton compte": email (required) + first name (optional). The email is sent to `/api/account` and stored in a new `accounts` table (one row per email, no password); "Tout passer" only appears after this step | The team wants every player who does the onboarding to have an account tied to an email |
| The account email is never used to write to players; the "prochains défis" emails still need the consent box (`emails` table), now prefilled with the account email | Keeps consent for messages separate from account creation. Privacy page updated |
| Event `account_create` (no email in the payload) and "Comptes créés" in `/stats` | Measure how many players create an account |

## 2026-10-21: Day 3 (traction): tools for the commitment ladder
The course grades commitments by level (deck slides 40–42), each with a trace in the evidence log. A commitment from someone the team already knew counts one level lower.
| Level | What polis now captures | Trace |
|---|---|---|
| 1 · a little time | Email for the next challenges (existing) | `/stats` → Échelle d'engagement → CSV of emails with timestamp and tester tag |
| 2 · time | Players who come back another day (daily challenge, streak); "Ajouter ces dates à mon agenda" in the voting guide (.ics with a reminder, event `calendar_add`) | CSV of returning players (days active, tag) |
| 3 · reputation | Players who **share** a challenge (`share_click`: WhatsApp, copy, share sheet); new: "OK pour être cité·e" in the feedback survey (optional first name). A friend opening or playing the link is not counted at this level (team decision, 2026-10-21) | CSV of shares (time, tag, method, challenge code) and quotable feedback |
| 4 · formal commitment | New page `/partenaires`: a student organisation (BDE, club, class) commits in writing (name, role, email, commitments: team match, "register to vote" session before 12 March 2027, relay to members, meeting), with a reference and timestamp on screen | `partner_pledge` events, list + CSV in `/stats` |
- Stored in `events` (no schema change); contact details only with the consent box ticked; privacy page updated.
- Baseline when this shipped (2026-10-21, ~10:45): L1 0 emails, L2 3 players came back another day, L3 2 shares and 1 friend play, L4 0.

## 2026-10-21: timeline "La ligne du temps" (`/frise`, requested by the team)
| Decision | Why |
|---|---|
| 3 tracks: **candidates** (10 people, 5–6 events each), **great debates** (the 9 debates between the two rounds, 1974–2022, incl. 2002 when there was none), **history** (18 dates, 1944–2026, each with "why it matters in 2027") | Understand where the candidates come from and how the rules of today were made |
| Interactive: "Qui a dit ça ?" on each debate (+5 voix, first answer kept), "Remets dans l'ordre" with 4 random history dates (+20 voix once a day, badge "Mémoire vive"), items fade in as you scroll, candidate picker | A game layer, like the rest of the app |
| Candidates: same criteria for everyone (offices, elections with official Conseil constitutionnel scores, 2027 status); camps take turns in the picker and the first candidate shown changes every day; no party colours | Neutrality (A6) |
| Court cases left out, except Marine Le Pen's appeal ruling of 7 July 2026, because it decides whether she can stand (stated neutrally: 45 months of ineligibility, 30 suspended, so she can run; appeal to the Cour de cassation pending) | Only what changes the 2027 race |
| Debates: quotes balanced (4 left, 4 right / far right, 1 Macron); no "who won"; interpretive "why it matters" lines rewritten as facts | Neutrality |
| Every event has a source (Conseil constitutionnel, Assemblée, Sénat, Parlement européen, Élysée, Légifrance, INA, LCP, Public Sénat, France 24/AFP…), checked on 2026-10-21; no Wikipedia | Editorial rule: facts only, a source for every item |
| Known limits: 2024 European scores come from Public Sénat (official ministry site blocked); some dates are only a year or a month; Wauquiez has not declared (his 2026 item is his stated position) | Logged rather than hidden |

## 2026-10-21: /stats counts people, not sessions (team question: "we didn't talk to 81 people")
| Decision | Why |
|---|---|
| A **tester = one `?t=` tag**, even with several sessions (WhatsApp's in-app browser, Safari and a laptop each create a session). An untagged session still counts as one visitor | 81 "players" were 81 sessions: 21 tagged sessions for 16 tags, and 60 untagged sessions, 54 of which only opened a page |
| Tags starting with **ZZ** are the team's own tests and are left out of every number (today: ZZV2, ZZEVERY3, 2 sessions) | Team tests were inflating the counts |
| New block "Qui compte comme joueur ?": testers, untagged visitors who played vs only opened a page, excluded test sessions | Shows where the totals come from |
| Same rule for the share rate, the return rate and the commitment ladder (levels 2 and 3 per person) | One definition everywhere |
- **Effect on the Test Card v2 metric** (threshold unchanged, ≥ 40 %): before, 5 finished out of 19 tagged *sessions* (26 %); now 5 out of 14 tagged *testers* (36 %). The threshold did not move; the denominator was corrected to count people instead of browsers. Log this change, and why, next to the result.
- Still to check by hand: whether any of the 14 tags (e.g. T01, 3 sessions) or the untagged sessions that "came back" are team members.

## 2026-10-21: commitments made easy and visible (Day 3 sprint, requested by the team)
| Change | Marketing lever | Level |
|---|---|---|
| Result page: one-tap green "Envoyer sur WhatsApp · +30 voix" inside the score card, with "Tes amis feraient mieux ?" | Ask at the peak moment, one tap instead of a menu, reward, curiosity/competition | 3 |
| "Rappelle-moi demain": pick 8h / 12h30 / 19h, a 5-minute event with an alert goes into the phone's calendar (+10 voix once a day). On the result page and on the daily challenge once done | Small, concrete "book a slot" commitment (foot in the door), reward | 2 |
| Email box moved right under the score, prefilled with the account email, value first ("Ne rate pas le 12 mars": reminder before the registration deadline, one challenge a month, prediction results), +20 voix. Consent box still unticked by default | Deadline, concrete value, reward, less friction; consent stays explicit (RGPD) | 1 |
| "Asso, BDE, promo ? Organise un match polis" card on the home page (returning players), result page, Défis and Profil | Visible everywhere a group leader may be | 4 |
| Answers on the result page folded into "Voir la correction" | The commitment asks are visible without scrolling | all |
- **Promise to keep**: the email box now promises a reminder before the 12 March 2027 registration deadline. Someone in the team must send it.

## 2026-10-21: bug — account creation failed for every new player
- Cause: the `accounts` table was added to `supabase/schema.sql` but the SQL was never run on the Supabase project (API error "Could not find the table 'public.accounts'"). Every new player was stuck on the first onboarding step ("Tout passer" only appears after it).
- Code fix: a failed account save no longer blocks the onboarding; the email stays on the phone and is sent again on the next visit (`p27.accountSynced`, `components/Boot.tsx`). `account_create` is only tracked once the server saved it.
- Still to do in Supabase (SQL Editor): create the `accounts` table from `supabase/schema.sql`. Until then no account is stored.

## 2026-10-21: account email at onboarding is optional again
| Decision | Why |
|---|---|
| The first onboarding step keeps "Crée ton compte" but adds "Continuer sans compte" (event `account_skip`, counted in `/stats` next to "Comptes créés") | A required email is not a commitment (level 1 counts an email given by choice), it adds friction before the first challenge (primary metric), and round-2 testers had already found the onboarding too pushy (every step became skippable). Data minimisation (RGPD): the account has no password and no use yet |
| The email ask that counts for the commitment ladder is the one after a challenge ("Ne rate pas le 12 mars", consent box) | Asked once the player has seen the value |
- Decided by the team on 2026-10-21, after the required email was added the same morning.

## 2026-10-21: consistency pass (requested by the team)
| Fixed | Before |
|---|---|
| Email consent now lists every message promised: reminder before 12 March 2027, one challenge a month until the vote, prediction results | The box promised all three, the consent box only covered "the next challenges" |
| "Désinscription en un clic" removed ("Pas de spam : ces messages-là, rien d'autre") | Promised a one-click unsubscribe that does not exist |
| Privacy page: the account is optional | Still said the account is created with your email |
| Feedback: "pas d'informations personnelles ni d'opinion politique" in the comment | Said "don't write your name", then asked a first name to quote it |
| Timeline track renamed "Candidats et figures", with each person's 2027 status (declared / not a candidate / not declared yet, as of the check date) | "Les candidats" included Jordan Bardella (not a candidate) and Laurent Wauquiez (not declared) |
| `/stats` level 1 leaves out emails from team test sessions (ZZ tags) | They were counted, unlike everything else |
| `/stats` says that calendar adds and shares are taps (the real add/send can't be verified) | Could be read as stronger evidence than it is |
| Back arrow on `/voter`, `/frise`, `/partenaires` goes to Défis, and the Défis tab stays lit | Back went to the feed |
| **Still open**: `content/site.json` `contactEmail` is the placeholder `TODO-equipe@exemple.fr` (privacy page contact, needed for data requests and to unsubscribe); the reminder before 12 March, the monthly challenge and prediction results must actually be sent by the team | Team decision: no address for now |

## 2026-10-21: a home page for returning players (requested by the team)
| Decision | Why |
|---|---|
| Players who did the onboarding now land on a personal home: greeting, days to the 1st round, day streak, city level and voix, their city (tap → Ma ville), a registration reminder if they can vote but aren't registered (J-x to 12 March 2027 → voting guide), today's challenge, 4 shortcuts (News, Challenges, Timeline, Voting) and the partner card | Once onboarded, there was no landing page: the installed app opened on the feed, the logo went to the feed and the tab bar had no Home |
| New "Accueil" tab (5 tabs), the logo always goes home, the installed app (`manifest.ts`) opens on `/` | Home reachable from everywhere |
| New visitors and friends opening a challenge link (`/?c=`) keep the welcome page, without the tab bar | First impression and the friend flow unchanged |

## 2026-10-21: colours changed to bleu, blanc, rouge (requested by the team)
| Decision | Why |
|---|---|
| White background and cards, République blue (`#2546e0`) for actions, navy (`#0b1f5c`) for the dark blocks, red (`#e1000f`) as the accent on those blocks, a thin tricolour stripe under the top bar; link preview, app icon theme and city flags follow | Team request: the national colours |
| Institutional tones, red kept as an accent only; camps are still shown with neutral chips and icons, never with colours | National colours rather than a party's (neutrality, A6); red is also the "wrong answer" colour, so it can't be the main button colour |
| Replaces the orange accent of the iOS redesign | |

## 2026-10-21: commitment asks as pop-ups, Instagram, partners removed (requested by the team)
| Decision | Why |
|---|---|
| After a challenge, two pop-ups in a row: the email (consent box, "Plus tard" to skip), then "Suis-nous sur Instagram / Follow us on Instagram — stay updated on our journey" (@polis_app). Each shows at most once per tab and never again once answered; they wait for the level-up and share sheet to close | The result page was too busy; one clear ask at a time is easier to act on |
| Result page reduced to: score + WhatsApp share, next step, answers (folded), feedback. The inline email box, the calendar reminder and the sticky share button left the page (the reminder stays on the daily challenge once done) | Cleaner page |
| `/partenaires`, its API, the "Asso, BDE, promo" card and the level-4 row of `/stats` removed | The team doesn't want partnerships and has no time to follow up. No pledge had been recorded |
| Instagram also linked in the home footer and Profil. Events `prompt_view` (pop-up shown) and `instagram_click`; `/stats` level 1 shows emails and Instagram taps with how many people saw each pop-up (conversion), the follow itself can't be verified | Measure the asks |
| Instagram link stored without the QR-code tracking parameters (`content/site.json`) | Clean link |
