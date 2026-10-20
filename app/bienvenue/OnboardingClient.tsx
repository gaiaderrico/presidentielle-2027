"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconBack } from "@/components/Icons";
import { Button } from "@/components/ui";
import onboarding from "@/content/onboarding.json";
import { topics } from "@/lib/content";
import { EMPTY_PROFILE, computeLevel, getProfile, saveProfile, type Profile } from "@/lib/profile";
import { track } from "@/lib/track";
import { addVoix } from "@/lib/voix";

const STEPS = 6;

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-left font-semibold transition ${selected ? "border-accent bg-accent-soft text-ink" : "border-line bg-card"}`}
    >
      {children}
    </button>
  );
}

function Group<T extends string>({ question, options, value, onChange }: { question: string; options: { id: string; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-lg font-bold">{question}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Choice key={o.id} selected={value === o.id} onClick={() => onChange(o.id as T)}>
            {o.label}
          </Choice>
        ))}
      </div>
    </fieldset>
  );
}

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [answers, setAnswers] = useState<(number | null)[]>(onboarding.knowledge.map(() => null));
  const [checked, setChecked] = useState(false);
  const [ideasTouched, setIdeasTouched] = useState(false);

  useEffect(() => {
    const current = getProfile();
    setP({ ...current, firstName: current.firstName || "" });
    if (current.position !== null) setIdeasTouched(true);
  }, []);

  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const back = () => (step === 0 ? router.push("/") : setStep(step - 1));
  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  const knowledge = answers.filter((a, i) => a === onboarding.knowledge[i].answer).length;
  const level = computeLevel(knowledge, p.followsNews);

  const finish = () => {
    const final: Profile = { ...p, knowledge, level, done: true };
    saveProfile(final);
    // The position (political ideas) is deliberately NOT sent.
    track("onboarding_finish", {
      level,
      knowledge,
      followsNews: final.followsNews,
      voted: final.voted,
      registered: final.registered,
      interests: final.interests,
    });
    addVoix(20, "Profil complété", "profil");
    router.push("/feed");
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-10 pt-3">
      <div className="flex items-center gap-3">
        <button onClick={back} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-card" aria-label="Étape précédente">
          <IconBack />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-sm font-semibold tabular-nums text-muted">
          {step + 1}/{STEPS}
        </span>
      </div>

      {step === 0 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Faisons connaissance</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">Salut ! Comment tu t&apos;appelles ?</h1>
            <p className="mt-2 text-muted">Quelques questions rapides pour adapter les actus à ton niveau et à ce qui t&apos;intéresse. Moins d&apos;une minute.</p>
          </div>
          <label htmlFor="ob-name" className="sr-only">
            Ton prénom
          </label>
          <input
            id="ob-name"
            maxLength={20}
            autoComplete="given-name"
            placeholder="Ton prénom (facultatif)"
            value={p.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
            className="min-h-14 rounded-2xl border-2 border-line bg-card px-4 text-lg"
          />
          <p className="-mt-3 text-sm text-muted">Il sert seulement à montrer à tes amis qui les défie.</p>
          <Button onClick={next}>Continuer</Button>
        </section>
      )}

      {step === 1 && (
        <section className="pop flex flex-col gap-6">
          <h1 className="font-display text-3xl font-extrabold leading-tight">Toi et la politique</h1>
          <Group question={onboarding.followsNews.question} options={onboarding.followsNews.options} value={p.followsNews} onChange={(v) => set({ followsNews: v })} />
          <Group question={onboarding.voted.question} options={onboarding.voted.options} value={p.voted} onChange={(v) => set({ voted: v })} />
          <Group question={onboarding.registered.question} options={onboarding.registered.options} value={p.registered} onChange={(v) => set({ registered: v })} />
          {p.registered && p.registered !== "oui" && <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold">{onboarding.registered.help}</p>}
          <Button onClick={next} disabled={!p.followsNews || !p.voted || !p.registered}>
            Continuer
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">Petit test de niveau</h1>
            <p className="mt-1 text-muted">3 questions, sans pression. Ça sert juste à choisir par où commencer.</p>
          </div>
          {onboarding.knowledge.map((q, qi) => (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="mb-2 font-display text-lg font-bold">{q.question}</legend>
              <div className="flex flex-col gap-2">
                {q.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  const state = !checked ? (picked ? "border-accent bg-accent-soft" : "border-line bg-card") : oi === q.answer ? "border-ok bg-ok-soft" : picked ? "border-bad bg-bad-soft" : "border-line bg-card opacity-60";
                  return (
                    <button
                      key={o}
                      type="button"
                      disabled={checked}
                      onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                      aria-pressed={picked}
                      className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-left font-semibold transition ${state}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {checked && <p className="text-sm text-muted">{q.explanation}</p>}
            </fieldset>
          ))}
          {!checked ? (
            <Button onClick={() => setChecked(true)} disabled={answers.some((a) => a === null)}>
              Voir mes réponses
            </Button>
          ) : (
            <>
              <p className="rounded-2xl bg-card px-4 py-3 text-center font-display text-xl font-bold">
                {knowledge}/3 bonnes réponses
              </p>
              <Button onClick={next}>Continuer</Button>
            </>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">Qu&apos;est-ce qui t&apos;intéresse ?</h1>
            <p className="mt-1 text-muted">Choisis autant de sujets que tu veux. Ils passent en premier dans ton fil, mais tu verras quand même tous les bords.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const on = p.interests.includes(t.id);
              return (
                <Choice key={t.id} selected={on} onClick={() => setP((x) => ({ ...x, interests: x.interests.includes(t.id) ? x.interests.filter((i) => i !== t.id) : [...x.interests, t.id] }))}>
                  <span aria-hidden>{t.emoji}</span> {t.label}
                </Choice>
              );
            })}
          </div>
          <Button onClick={next}>{p.interests.length ? "Continuer" : "Tout m'intéresse"}</Button>
        </section>
      )}

      {step === 4 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">{onboarding.ideas.question}</h1>
            <p className="mt-2 rounded-2xl border border-line bg-card px-4 py-3 text-sm">🔒 {onboarding.ideas.privacy}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5">
            <label htmlFor="ob-position" className="sr-only">
              Ta position, de 0 (gauche) à 10 (droite)
            </label>
            <input
              id="ob-position"
              type="range"
              min={0}
              max={10}
              step={1}
              value={p.position ?? 5}
              onChange={(e) => {
                setIdeasTouched(true);
                set({ position: Number(e.target.value) });
              }}
              className={`w-full accent-[var(--accent)] ${ideasTouched ? "" : "opacity-50"}`}
            />
            <div className="flex justify-between text-sm font-semibold text-muted">
              <span>Gauche</span>
              <span>Centre</span>
              <span>Droite</span>
            </div>
            {!ideasTouched && <p className="text-center text-sm text-muted">Fais glisser le curseur, ou choisis une option ci-dessous.</p>}
          </div>
          <Button onClick={next} disabled={!ideasTouched}>
            Continuer
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                set({ position: null });
                setIdeasTouched(false);
                next();
              }}
            >
              Je ne sais pas encore
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                set({ position: null });
                setIdeasTouched(false);
                next();
              }}
            >
              Je préfère ne pas répondre
            </Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="pop flex flex-col gap-5">
          <div className="rounded-3xl bg-ink p-6 text-paper">
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Ton niveau</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{onboarding.levels[level].label}</p>
            <p className="mt-2 opacity-90">{onboarding.levels[level].text}</p>
          </div>
          <ul className="flex flex-col gap-3">
            <li className="rounded-2xl border border-line bg-card px-4 py-3">
              <strong>Ton fil :</strong> des actus de la gauche, du centre, de la droite et de l&apos;extrême droite, plus des infos neutres, en alternance.
              {p.position !== null && " On commence par les camps les plus éloignés de toi."}
            </li>
            {p.interests.length > 0 && (
              <li className="rounded-2xl border border-line bg-card px-4 py-3">
                <strong>Tes sujets en premier :</strong> {p.interests.map((id) => topics.find((t) => t.id === id)?.label).join(", ")}
              </li>
            )}
            {p.registered !== "oui" && (
              <li className="rounded-2xl border-2 border-accent bg-accent-soft px-4 py-3">
                <strong>À faire avant le 12 mars 2027 :</strong> vérifier ton inscription sur les listes électorales.{" "}
                <a href={onboarding.registered.checkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  Vérifier sur service-public.fr ↗
                </a>
              </li>
            )}
          </ul>
          <Button onClick={finish}>Voir mes actus (+20 voix)</Button>
        </section>
      )}
    </main>
  );
}
