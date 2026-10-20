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
