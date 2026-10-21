import { db, fetchAll, passwordOk, readJsonBody } from "@/lib/server/db";

type EventRow = { created_at: string; session_id: string | null; event: string; payload: Record<string, unknown> };

function countBy<T>(list: T[], key: (t: T) => string | null | undefined) {
  const out: Record<string, number> = {};
  for (const item of list) {
    const k = key(item);
    if (k) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function sessionsWith(events: EventRow[], name: string) {
  return new Set(events.filter((e) => e.event === name && e.session_id).map((e) => e.session_id as string));
}

export async function POST(req: Request) {
  const body = await readJsonBody(req, 500);
  if (!process.env.STATS_PASSWORD) return Response.json({ error: "STATS_PASSWORD n'est pas configuré sur le serveur." }, { status: 503 });
  if (!passwordOk(body?.password)) return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  const sb = db();
  if (!sb) return Response.json({ error: "Supabase n'est pas configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." }, { status: 503 });

  const allEvents = await fetchAll<EventRow>("events", "created_at, session_id, event, payload");

  // Who is who. A session is one browser on one device: the same person can have several (WhatsApp's in-app browser,
  // Safari, a laptop…). A tester tag (?t=T03) groups that person's sessions; an untagged session counts as one visitor.
  // Tags starting with "ZZ" are the team's own tests: their sessions are left out of every number.
  const tagBySession = new Map<string, string>();
  for (const e of allEvents) {
    const tag = e.payload?.testerTag;
    if (e.session_id && typeof tag === "string" && tag && !tagBySession.has(e.session_id)) tagBySession.set(e.session_id, tag);
  }
  const isTestTag = (tag: string) => /^ZZ/i.test(tag);
  const testSessions = new Set([...tagBySession].filter(([, tag]) => isTestTag(tag)).map(([sid]) => sid));
  const events = allEvents.filter((e) => !e.session_id || !testSessions.has(e.session_id));
  const personOf = (sid: string) => (tagBySession.has(sid) ? `tag:${tagBySession.get(sid)}` : `session:${sid}`);
  const people = (sessions: Iterable<string>) => new Set([...sessions].map(personOf));
  const emailRows = await fetchAll<{ created_at: string; email: string; session_id: string | null }>("emails", "created_at, email, session_id");
  const emailCount = emailRows.length;
  const { count: accountCount } = await sb.from("accounts").select("id", { count: "exact", head: true });

  const p = (e: EventRow, k: string) => (e.payload?.[k] ?? null) as string | number | boolean | null;

  // Primary metric (Test Card v2): people who finished ≥1 challenge (mini-quiz included) ÷ people who opened the app.
  // Counted per person (tester tag), not per session.
  const finishedSessions = sessionsWith(events, "challenge_finish");
  const allSessions = new Set(events.filter((e) => e.session_id).map((e) => e.session_id as string));
  const taggedSessions = new Set([...allSessions].filter((s) => tagBySession.has(s)));
  const finishedPeople = people(finishedSessions);
  const allPeople = people(allSessions);
  const taggedPeople = people(taggedSessions);
  const finishedTagged = [...taggedPeople].filter((x) => finishedPeople.has(x)).length;
  // Secondary metric (Test Card v1): people who finished ≥1 challenge AND clicked share ÷ people who finished ≥1 challenge.
  const sharedPeople = people(sessionsWith(events, "share_click"));
  const finishedAndShared = [...finishedPeople].filter((x) => sharedPeople.has(x)).length;
  // Untagged visitors: who only opened a page, and who actually played (read a card or started a challenge).
  const untaggedSessions = [...allSessions].filter((s) => !tagBySession.has(s));
  const playedSessions = new Set(events.filter((e) => e.session_id && (e.event === "feed_card_view" || e.event === "challenge_start")).map((e) => e.session_id as string));

  const landingSessions = sessionsWith(events, "landing_view");
  const feedStartSessions = sessionsWith(events, "feed_card_view");
  const feedSkipSessions = sessionsWith(events, "feed_skip");
  const quizFinish = events.filter((e) => e.event === "quiz_finish");
  const cityViewSessions = sessionsWith(events, "city_view");

  const friendLandings = events.filter((e) => e.event === "friend_landing_view");
  const friendFinishes = events.filter((e) => e.event === "friend_finish");
  const perCode: Record<string, { opened: number; finished: number }> = {};
  for (const e of friendLandings) {
    const c = String(p(e, "refCode") ?? "");
    if (c) (perCode[c] ??= { opened: 0, finished: 0 }).opened++;
  }
  for (const e of friendFinishes) {
    const c = String(p(e, "refCode") ?? "");
    if (c) (perCode[c] ??= { opened: 0, finished: 0 }).finished++;
  }

  const starts = events.filter((e) => e.event === "challenge_start" && p(e, "origin") !== "feed");
  const levelsChosen = countBy(starts, (e) => String(p(e, "level") ?? "progressif"));
  const inlineStarts = sessionsWith(events.filter((e) => p(e, "origin") === "feed-inline"), "challenge_start");
  const inlineFinishes = sessionsWith(events.filter((e) => p(e, "origin") === "feed-inline"), "challenge_finish");
  const reachedThreeCards = [...new Set(events.filter((e) => e.event === "feed_card_view" && e.session_id).map((e) => e.session_id as string))].filter(
    (sid) => events.filter((e) => e.event === "feed_card_view" && e.session_id === sid).length >= 3,
  );
  const shares = events.filter((e) => e.event === "share_click");

  const answers = events.filter((e) => e.event === "answer");
  const itemStats: Record<string, { type: string; n: number; correct: number }> = {};
  for (const e of answers) {
    const id = String(p(e, "itemId") ?? "");
    if (!id) continue;
    const s = (itemStats[id] ??= { type: String(p(e, "challengeType") ?? ""), n: 0, correct: 0 });
    s.n++;
    if (p(e, "correct") === true) s.correct++;
  }

  const reactions = events.filter((e) => e.event === "feed_reaction");
  const likesPerCamp = countBy(reactions.filter((e) => p(e, "reaction") === "up"), (e) => String(p(e, "camp")));
  const dislikesPerCamp = countBy(reactions.filter((e) => p(e, "reaction") === "down"), (e) => String(p(e, "camp")));

  // Per-session table
  const bySession = new Map<string, EventRow[]>();
  for (const e of events) {
    if (!e.session_id) continue;
    const list = bySession.get(e.session_id) ?? [];
    list.push(e);
    bySession.set(e.session_id, list);
  }
  const sessions = [...bySession.entries()].map(([id, list]) => {
    const finishes = list.filter((e) => e.event === "challenge_finish");
    const voix = list.filter((e) => e.event === "points_earned").reduce((s, e) => s + Number(p(e, "amount") ?? 0), 0);
    const levelsReached = list.filter((e) => e.event === "level_up").map((e) => String(p(e, "level")));
    const tag = list.map((e) => p(e, "testerTag")).find((t) => t) ?? null;
    return {
      sessionId: id.slice(0, 8),
      testerTag: tag,
      firstSeen: list[0].created_at,
      cardsViewed: list.filter((e) => e.event === "feed_card_view").length,
      skippedFeed: list.some((e) => e.event === "feed_skip"),
      challenges: finishes
        .map((e) => `${p(e, "challengeType")}${p(e, "origin") === "feed" ? " (après feed)" : p(e, "origin") === "feed-inline" ? " (défi rapide dans le fil)" : p(e, "origin") === "daily" ? " (défi du jour)" : ""} [${p(e, "mode")}]`)
        .join(", "),
      scores: finishes.map((e) => (p(e, "score") === null ? "prono" : String(p(e, "score")))).join(", "),
      voix,
      level: levelsReached.at(-1) ?? "Hameau",
      cityViewed: list.some((e) => e.event === "city_view"),
      shared: list.some((e) => e.event === "share_click"),
      shareMethods: [...new Set(list.filter((e) => e.event === "share_click").map((e) => String(p(e, "method"))))].join(", "),
      cameFromFriend: list.some((e) => e.event === "friend_landing_view"),
      email: list.some((e) => e.event === "email_submit"),
    };
  });
  sessions.sort((a, b) => (a.firstSeen < b.firstSeen ? 1 : -1));

  const onboard = events.filter((e) => e.event === "onboarding_finish");
  const interestCounts: Record<string, number> = {};
  for (const e of onboard) for (const t of (Array.isArray(e.payload?.interests) ? e.payload.interests : []) as string[]) interestCounts[t] = (interestCounts[t] ?? 0) + 1;
  const buildingOpens = events.filter((e) => e.event === "city_building_open");

  // Engagement: players who came back on another day (Paris time), daily challenge, badges, feedback.
  const parisDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  // Days active per person: a tester who played on 2 different days, even on 2 different phones, came back.
  const daysByPerson = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.session_id) continue;
    const key = personOf(e.session_id);
    (daysByPerson.get(key) ?? daysByPerson.set(key, new Set()).get(key)!).add(parisDay(e.created_at));
  }
  const activeDays = [...daysByPerson.values()].map((d) => d.size);
  const dailyEvents = events.filter((e) => p(e, "origin") === "daily");
  const feedback = events.filter((e) => e.event === "feedback_submit");
  const ratings = feedback.map((e) => Number(p(e, "rating"))).filter((r) => r >= 1 && r <= 5);

  // Commitment ladder (course, Day 3): every level with its trace.
  const tagOf = (sid: string | null) => (sid ? (bySession.get(sid)?.map((e) => p(e, "testerTag")).find((t) => t) as string | undefined) ?? null : null);
  const label = (key: string) => (key.startsWith("tag:") ? key.slice(4) : `sans tag (${key.slice(8, 16)})`);
  const pledges = events.filter((e) => e.event === "partner_pledge");
  const ladder = {
    l1: { emails: emailRows.map((r) => ({ at: r.created_at, email: r.email, testerTag: tagOf(r.session_id) })) },
    l2: {
      returning: [...daysByPerson.entries()].filter(([, d]) => d.size >= 2).map(([key, d]) => ({ person: label(key), days: d.size, dates: [...d].sort().join(" ") })),
      calendarAdds: events.filter((e) => e.event === "calendar_add").map((e) => ({ at: e.created_at, testerTag: tagOf(e.session_id) })),
    },
    l3: {
      // Level 3 counts the player who shares (share_click), not the friend who opens or plays the link.
      shares: shares.map((e) => ({ at: e.created_at, person: e.session_id ? label(personOf(e.session_id)) : "", testerTag: tagOf(e.session_id), method: String(p(e, "method") ?? ""), code: String(p(e, "challengeCode") ?? "") })),
      quotes: feedback.filter((e) => p(e, "quotable") === true).map((e) => ({ at: e.created_at, name: String(p(e, "name") ?? ""), rating: Number(p(e, "rating")), comment: String(p(e, "comment") ?? ""), testerTag: tagOf(e.session_id) })),
    },
    l4: {
      pledges: pledges.map((e) => ({
        at: e.created_at,
        ref: String(p(e, "ref") ?? ""),
        org: String(p(e, "org") ?? ""),
        name: String(p(e, "name") ?? ""),
        role: String(p(e, "role") ?? ""),
        email: String(p(e, "email") ?? ""),
        commitments: (Array.isArray(e.payload?.commitments) ? e.payload.commitments : []).join(", "),
        members: p(e, "members"),
        when: p(e, "when"),
        note: String(p(e, "note") ?? ""),
        testerTag: (p(e, "testerTag") as string | null) ?? tagOf(e.session_id),
      })),
    },
  };

  const voixValues = sessions.map((s) => s.voix);
  return Response.json({
    funnel: {
      landingViews: people(landingSessions).size,
      feedStarts: people(feedStartSessions).size,
      feedSkips: people(feedSkipSessions).size,
      quizFinishes: quizFinish.length,
      challengeFinishers: finishedPeople.size,
    },
    completionRate: {
      finished: finishedPeople.size,
      players: allPeople.size,
      rate: allPeople.size ? finishedPeople.size / allPeople.size : null,
      tagged: { finished: finishedTagged, players: taggedPeople.size, rate: taggedPeople.size ? finishedTagged / taggedPeople.size : null },
    },
    people: {
      sessions: allSessions.size,
      testers: taggedPeople.size,
      testerSessions: taggedSessions.size,
      untagged: { sessions: untaggedSessions.length, played: untaggedSessions.filter((s) => playedSessions.has(s)).length },
      excludedTest: { sessions: testSessions.size, tags: [...new Set([...tagBySession.values()].filter(isTestTag))] },
    },
    inlineChallenge: { reached: people(reachedThreeCards).size, started: people(inlineStarts).size, finished: people(inlineFinishes).size },
    shareRate: { finishedAndShared, finished: finishedPeople.size, rate: finishedPeople.size ? finishedAndShared / finishedPeople.size : null },
    friends: { opened: new Set(friendLandings.map((e) => e.session_id)).size, finished: new Set(friendFinishes.map((e) => e.session_id)).size, perCode },
    challengesChosen: countBy(starts, (e) => String(p(e, "challengeType"))),
    modesChosen: countBy(starts, (e) => String(p(e, "mode"))),
    levelsChosen,
    sharedPerType: countBy(shares, (e) => String(p(e, "challengeType"))),
    shareMethods: countBy(shares, (e) => String(p(e, "method"))),
    items: itemStats,
    feed: {
      avgCardsViewed: feedStartSessions.size ? sessions.filter((s) => s.cardsViewed > 0).reduce((a, s) => a + s.cardsViewed, 0) / feedStartSessions.size : 0,
      skipRate: landingSessions.size ? feedSkipSessions.size / landingSessions.size : null,
      likesPerCamp,
      dislikesPerCamp,
    },
    quizAvg: quizFinish.length ? quizFinish.reduce((a, e) => a + Number(p(e, "score") ?? 0), 0) / quizFinish.length : null,
    voix: {
      avg: voixValues.length ? voixValues.reduce((a, b) => a + b, 0) / voixValues.length : 0,
      levels: countBy(sessions, (s) => s.level),
      cityViewRate: bySession.size ? cityViewSessions.size / bySession.size : null,
    },
    emails: emailCount ?? 0,
    accounts: accountCount ?? 0,
    accountSkips: people(sessionsWith(events, "account_skip")).size,
    profile: {
      completed: onboard.length,
      levels: countBy(onboard, (e) => String(p(e, "level"))),
      registered: countBy(onboard, (e) => String(p(e, "registered"))),
      voter: countBy(onboard, (e) => String(p(e, "voter"))),
      testSkipped: onboard.filter((e) => p(e, "testSkipped") === true).length,
      interests: interestCounts,
    },
    city: { buildingOpens: countBy(buildingOpens, (e) => String(p(e, "building"))) },
    engagement: {
      players: activeDays.length,
      returning: activeDays.filter((n) => n >= 2).length,
      daysPlayed: countBy(activeDays, (n) => (n >= 4 ? "4+" : String(n))),
      dailyStarted: sessionsWith(dailyEvents, "challenge_start").size,
      dailyFinished: sessionsWith(dailyEvents, "challenge_finish").size,
      badges: countBy(events.filter((e) => e.event === "badge_unlock"), (e) => String(p(e, "badge"))),
    },
    feedback: {
      count: ratings.length,
      avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      ratings: countBy(ratings, (r) => `${r} ★`),
      comments: feedback
        .filter((e) => p(e, "comment"))
        .map((e) => ({ at: e.created_at, rating: Number(p(e, "rating")), comment: String(p(e, "comment")), testerTag: p(e, "testerTag") as string | null }))
        .reverse(),
    },
    ladder,
    sessions,
  });
}
