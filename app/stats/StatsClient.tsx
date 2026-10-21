"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card } from "@/components/ui";
import { badges, defis, allFeedCards, allQuizItems, quiProposeItems, vraiFauxItems, autreCamp } from "@/lib/content";

type Stats = {
  funnel: { landingViews: number; feedStarts: number; feedSkips: number; quizFinishes: number; challengeFinishers: number };
  completionRate: {
    finished: number;
    players: number;
    rate: number | null;
    tagged: { finished: number; players: number; rate: number | null };
  };
  shareRate: { finishedAndShared: number; finished: number; rate: number | null };
  inlineChallenge: { reached: number; started: number; finished: number };
  friends: { opened: number; finished: number; perCode: Record<string, { opened: number; finished: number }> };
  challengesChosen: Record<string, number>;
  modesChosen: Record<string, number>;
  sharedPerType: Record<string, number>;
  shareMethods: Record<string, number>;
  items: Record<string, { type: string; n: number; correct: number }>;
  feed: { avgCardsViewed: number; skipRate: number | null; likesPerCamp: Record<string, number>; dislikesPerCamp: Record<string, number> };
  quizAvg: number | null;
  voix: { avg: number; levels: Record<string, number>; cityViewRate: number | null };
  emails: number;
  accounts: number;
  profile: { completed: number; levels: Record<string, number>; registered: Record<string, number>; voter: Record<string, number>; testSkipped: number; interests: Record<string, number> };
  levelsChosen: Record<string, number>;
  city: { buildingOpens: Record<string, number> };
  engagement: { players: number; returning: number; daysPlayed: Record<string, number>; dailyStarted: number; dailyFinished: number; badges: Record<string, number> };
  feedback: { count: number; avg: number | null; ratings: Record<string, number>; comments: { at: string; rating: number; comment: string; testerTag: string | null }[] };
  ladder: {
    l1: { emails: { at: string; email: string; testerTag: string | null }[] };
    l2: { returning: { session: string; testerTag: string | null; days: number }[]; calendarAdds: { at: string; testerTag: string | null }[] };
    l3: {
      shares: { at: string; session: string; testerTag: string | null; method: string; code: string }[];
      quotes: { at: string; name: string; rating: number; comment: string; testerTag: string | null }[];
    };
    l4: { pledges: Record<string, string | number | null>[] };
  };
  sessions: {
    sessionId: string;
    testerTag: string | null;
    firstSeen: string;
    cardsViewed: number;
    skippedFeed: boolean;
    challenges: string;
    scores: string;
    voix: number;
    level: string;
    cityViewed: boolean;
    shared: boolean;
    shareMethods: string;
    cameFromFriend: boolean;
    email: boolean;
  }[];
};

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)} %`);
const typeName = (t: string) => (defis.names as Record<string, string>)[t] ?? t;

const itemLabels: Record<string, string> = Object.fromEntries([
  ...allQuizItems.map((i) => [i.id, i.question ?? ""]),
  ...vraiFauxItems.map((i) => [i.id, i.statement]),
  ...quiProposeItems.map((i) => [i.id, i.prompt ?? ""]),
  ...autreCamp.items.map((i) => [i.id, i.topic]),
]);

function Bars({ data, label = (k: string) => k }: { data: Record<string, number>; label?: (k: string) => string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (!entries.length) return <p className="text-sm text-muted">Pas encore de données.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {entries.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate">{label(k)}</span>
          <span className="h-3 rounded-full bg-line">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="text-right font-bold tabular-nums">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function download(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const head = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Day 3 of the course: the commitment ladder, with a trace for every level (exports go straight into the evidence log). */
function Ladder({ ladder, accounts }: { ladder: Stats["ladder"]; accounts: number }) {
  const sharers = new Set(ladder.l3.shares.map((s) => s.session)).size;
  const rows = [
    { level: 1, title: "Un peu de temps", value: ladder.l1.emails.length, detail: `emails laissés pour les prochains défis (avec consentement) · ${accounts} comptes créés avec un email`, exportName: "emails", data: ladder.l1.emails },
    { level: 2, title: "Du temps", value: ladder.l2.returning.length, detail: `joueurs revenus un autre jour · ${ladder.l2.calendarAdds.length} dates ajoutées à un agenda`, exportName: "revenus", data: ladder.l2.returning },
    { level: 3, title: "Réputation", value: sharers, detail: `joueurs qui ont partagé un défi (${ladder.l3.shares.length} partages) · ${ladder.l3.quotes.length} avis citables`, exportName: "reputation", data: [...ladder.l3.shares.map((s) => ({ type: "partage", ...s })), ...ladder.l3.quotes.map((q) => ({ type: "avis citable", ...q }))] },
    { level: 4, title: "Engagement formel", value: ladder.l4.pledges.length, detail: "engagements signés par une organisation (/partenaires)", exportName: "engagements", data: ladder.l4.pledges },
  ];
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">Échelle d&apos;engagement (Jour 3)</h2>
      <p className="-mt-2 text-sm text-muted">Chaque ligne s&apos;exporte en CSV horodaté : c&apos;est la trace à joindre au log. Un engagement d&apos;une personne que vous connaissiez compte un niveau en dessous.</p>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.level} className="flex items-center gap-3 rounded-2xl bg-fill px-3 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-ink">{r.level}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {r.title} : <span className="tabular-nums">{r.value}</span>
              </span>
              <span className="block text-sm text-muted">{r.detail}</span>
            </span>
            <button onClick={() => download(r.exportName, r.data as Record<string, unknown>[])} disabled={!r.data.length} className="shrink-0 rounded-full bg-card px-3 py-1 text-sm font-semibold text-accent disabled:opacity-40">
              CSV
            </button>
          </li>
        ))}
      </ul>
      {ladder.l4.pledges.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {ladder.l4.pledges.map((pl) => (
            <li key={String(pl.ref)} className="rounded-xl bg-accent-soft px-3 py-2">
              <strong>{pl.org}</strong> · {pl.name} ({pl.role}) · {pl.commitments}
              <span className="block text-xs text-muted">
                réf. {pl.ref} · {when(String(pl.at))}
                {pl.when ? ` · prévu le ${pl.when}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {ladder.l3.quotes.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {ladder.l3.quotes.map((q) => (
            <li key={q.at} className="rounded-xl bg-fill px-3 py-2">
              « {q.comment} » <span className="text-muted">— {q.name || "anonyme"}, {q.rating} ★ · {when(q.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function csv(rows: Stats["sessions"]) {
  const head = ["testerTag", "sessionId", "firstSeen", "cardsViewed", "skippedFeed", "challenges", "scores", "voix", "level", "cityViewed", "shared", "shareMethods", "cameFromFriend", "email"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h as keyof typeof r])).join(","))].join("\n");
}

export function StatsClient() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur");
        setStats(null);
      } else {
        setStats(json);
        try {
          sessionStorage.setItem("p27.statsPw", pw);
        } catch {}
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    }
    setLoading(false);
  };

  useEffect(() => {
    try {
      const pw = sessionStorage.getItem("p27.statsPw");
      if (pw) {
        setPassword(pw);
        load(pw);
      }
    } catch {}
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    load(password);
  };

  const exportCsv = () => {
    if (!stats) return;
    const blob = new Blob([csv(stats.sessions)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!stats) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold">Stats équipe</h1>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label htmlFor="pw" className="text-sm font-semibold">
            Mot de passe
          </label>
          <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 rounded-2xl border-2 border-line bg-card px-4" autoComplete="current-password" />
          {error && <p className="text-bad">{error}</p>}
          <Button type="submit" disabled={!password || loading}>
            {loading ? "Chargement…" : "Voir les stats"}
          </Button>
        </form>
      </main>
    );
  }

  // Test Card v2: passed if at least 40 % of players finish at least one challenge (mini-quiz included).
  const PASS = 0.4;
  const main = stats.completionRate.tagged.players > 0 ? stats.completionRate.tagged : stats.completionRate;
  const ok = main.rate !== null && main.rate >= PASS;
  const items = Object.entries(stats.items).sort((a, b) => a[1].correct / a[1].n - b[1].correct / b[1].n);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Stats équipe</h1>
        <div className="flex gap-2">
          <Button variant="secondary" className="!w-auto" onClick={() => load(password)} disabled={loading}>
            {loading ? "…" : "Rafraîchir"}
          </Button>
          <Button className="!w-auto" onClick={exportCsv}>
            Exporter en CSV
          </Button>
        </div>
      </div>

      <Card className={`border-2 ${ok ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"}`}>
        <p className="text-sm font-semibold">Test Card : au moins un défi terminé (objectif ≥ 40 %)</p>
        <p className={`font-display text-6xl font-extrabold tabular-nums ${ok ? "text-ok" : "text-bad"}`}>{pct(main.rate)}</p>
        <p className="text-sm">
          {main.finished} joueurs sur {main.players} ont terminé au moins un défi (mini-quiz après le fil inclus)
          {stats.completionRate.tagged.players > 0 ? " · testeurs avec étiquette ?t= uniquement" : ""}.
        </p>
        {stats.completionRate.tagged.players > 0 && (
          <p className="mt-1 text-sm text-muted">
            Tous les joueurs (testeurs + amis + visiteurs) : {stats.completionRate.finished} sur {stats.completionRate.players} ({pct(stats.completionRate.rate)}).
          </p>
        )}
      </Card>
      <Card className="flex flex-col gap-1">
        <p className="text-sm font-semibold">Défi rapide dans le fil (après 3 cartes)</p>
        <p>
          <strong>{stats.inlineChallenge.reached}</strong> joueurs ont lu au moins 3 cartes · <strong>{stats.inlineChallenge.started}</strong> ont commencé le défi rapide ·{" "}
          <strong>{stats.inlineChallenge.finished}</strong> l&apos;ont terminé ({pct(stats.inlineChallenge.reached ? stats.inlineChallenge.finished / stats.inlineChallenge.reached : null)})
        </p>
      </Card>
      <Card className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Taux de partage (ancien Test Card, ≥ 40 %)</p>
        <p className="font-display text-3xl font-extrabold tabular-nums">{pct(stats.shareRate.rate)}</p>
        <p className="w-full text-sm text-muted">
          {stats.shareRate.finishedAndShared} joueurs ont partagé sur {stats.shareRate.finished} qui ont fini au moins un défi.
        </p>
      </Card>

      <Ladder ladder={stats.ladder} accounts={stats.accounts} />

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Ils reviennent ?</h2>
          <p>
            <strong>{stats.engagement.returning}</strong> joueurs sur {stats.engagement.players} sont revenus un autre jour (
            {pct(stats.engagement.players ? stats.engagement.returning / stats.engagement.players : null)})
          </p>
          <p>
            Défi du jour : <strong>{stats.engagement.dailyStarted}</strong> commencé · <strong>{stats.engagement.dailyFinished}</strong> fini
          </p>
          <p className="text-sm font-semibold">Jours joués par joueur</p>
          <Bars data={stats.engagement.daysPlayed} label={(k) => `${k} jour${k === "1" ? "" : "s"}`} />
          <p className="text-sm font-semibold">Trophées débloqués</p>
          <Bars data={stats.engagement.badges} label={(k) => badges.find((b) => b.id === k)?.name ?? k} />
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Avis des joueurs</h2>
          <p>
            Note moyenne : <strong>{stats.feedback.avg === null ? "–" : stats.feedback.avg.toFixed(1)}</strong> / 5 ({stats.feedback.count} avis)
          </p>
          <Bars data={stats.feedback.ratings} />
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto text-sm">
            {stats.feedback.comments.map((f) => (
              <li key={f.at + f.comment} className="rounded-xl bg-fill px-3 py-2">
                <span className="font-semibold">{f.rating} ★</span> {f.comment}
                <span className="block text-xs text-muted">
                  {new Date(f.at).toLocaleString("fr-FR")}
                  {f.testerTag ? ` · ${f.testerTag}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Accueil", stats.funnel.landingViews],
          ["Fil commencé", stats.funnel.feedStarts],
          ["Fil passé", stats.funnel.feedSkips],
          ["Mini-quiz fini", stats.funnel.quizFinishes],
          ["Défi fini", stats.funnel.challengeFinishers],
        ].map(([k, v]) => (
          <Card key={k as string} className="!p-4">
            <p className="font-display text-3xl font-extrabold tabular-nums">{v}</p>
            <p className="text-sm text-muted">{k}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Preuve d&apos;un vrai envoi</h2>
          <p>
            <strong>{stats.friends.opened}</strong> amis ont ouvert un lien · <strong>{stats.friends.finished}</strong> ont fini le défi
          </p>
          <ul className="text-sm text-muted">
            {Object.entries(stats.friends.perCode).map(([code, v]) => (
              <li key={code} className="font-mono">
                {code} : {v.opened} ouvert · {v.finished} fini
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-bold">Voix, ville, emails</h2>
          <p>Moyenne : <strong>{Math.round(stats.voix.avg)}</strong> voix par joueur</p>
          <p>Ont ouvert « Ma ville » : <strong>{pct(stats.voix.cityViewRate)}</strong></p>
          <p>Mini-quiz moyen : <strong>{stats.quizAvg === null ? "–" : stats.quizAvg.toFixed(1)}</strong> / 3</p>
          <p>Comptes créés : <strong>{stats.accounts}</strong></p>
          <p>Emails collectés : <strong>{stats.emails}</strong></p>
          <div className="mt-2">
            <Bars data={stats.voix.levels} />
          </div>
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Défis choisis (hors mini-quiz du fil)</h2>
          <Bars data={stats.challengesChosen} label={typeName} />
          <h3 className="mt-2 font-semibold">Modes</h3>
          <Bars data={stats.modesChosen} />
          <h3 className="mt-2 font-semibold">Niveau choisi</h3>
          <Bars data={stats.levelsChosen} />
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Défis partagés</h2>
          <Bars data={stats.sharedPerType} label={typeName} />
          <h3 className="mt-2 font-semibold">Méthode</h3>
          <Bars data={stats.shareMethods} />
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Fil d&apos;actu</h2>
          <p>Cartes vues en moyenne : <strong>{stats.feed.avgCardsViewed.toFixed(1)}</strong> / {allFeedCards.length}</p>
          <p>Passent le fil : <strong>{pct(stats.feed.skipRate)}</strong></p>
          <h3 className="mt-2 font-semibold">👍 par camp (anonyme)</h3>
          <Bars data={stats.feed.likesPerCamp} />
          <h3 className="mt-2 font-semibold">👎 par camp (anonyme)</h3>
          <Bars data={stats.feed.dislikesPerCamp} />
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Profils ({stats.profile.completed})</h2>
          <h3 className="font-semibold">Niveau</h3>
          <Bars data={stats.profile.levels} />
          <h3 className="mt-2 font-semibold">Peut voter à la présidentielle (fr = oui, eu / non-eu / nsp = mode international)</h3>
          <Bars data={stats.profile.voter} />
          <p className="text-sm">Test de niveau passé (skippé) : {stats.profile.testSkipped}</p>
          <h3 className="mt-2 font-semibold">Inscrit·e sur les listes</h3>
          <Bars data={stats.profile.registered} />
          <h3 className="mt-2 font-semibold">Sujets choisis</h3>
          <Bars data={stats.profile.interests} />
          <p className="text-xs text-muted">La position politique n&apos;est jamais envoyée : elle reste sur le téléphone du joueur.</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">Bâtiments explorés dans « Ma ville »</h2>
          <Bars data={stats.city.buildingOpens} />
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">% de bonnes réponses par question</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {items.map(([id, s]) => (
              <li key={id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate" title={itemLabels[id] ?? id}>
                  {itemLabels[id] ?? id}
                </span>
                <span className="shrink-0 font-bold tabular-nums">
                  {Math.round((s.correct / s.n) * 100)} % <span className="font-normal text-muted">({s.n})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="!p-0">
        <h2 className="p-5 pb-3 font-display text-lg font-bold">Sessions ({stats.sessions.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-y border-line text-muted">
              <tr>
                {["Testeur", "Session", "Cartes", "Défis joués", "Scores", "Voix", "Niveau", "Ville vue", "Partagé", "Via ami", "Email"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.sessions.map((s) => (
                <tr key={s.sessionId} className="border-b border-line">
                  <td className="px-3 py-2 font-bold">{s.testerTag ?? "–"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.sessionId}</td>
                  <td className="px-3 py-2 tabular-nums">{s.skippedFeed && !s.cardsViewed ? "passé" : s.cardsViewed}</td>
                  <td className="px-3 py-2">{s.challenges || "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{s.scores || "–"}</td>
                  <td className="px-3 py-2 tabular-nums">{s.voix}</td>
                  <td className="px-3 py-2">{s.level}</td>
                  <td className="px-3 py-2">{s.cityViewed ? "oui" : "non"}</td>
                  <td className="px-3 py-2">{s.shared ? `oui (${s.shareMethods})` : "non"}</td>
                  <td className="px-3 py-2">{s.cameFromFriend ? "oui" : "non"}</td>
                  <td className="px-3 py-2">{s.email ? "oui" : "non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
