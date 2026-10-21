"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { IconBack } from "@/components/Icons";
import { Button } from "@/components/ui";
import { EMAIL_RE, createAccount } from "@/lib/api";
import { writeJSON } from "@/lib/storage";
import { useContent, useT } from "@/lib/i18n";
import { EMPTY_PROFILE, computeLevel, getProfile, isInternational, saveProfile, type LevelId, type Profile } from "@/lib/profile";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/track";
import { addVoix } from "@/lib/voix";

const STEPS = 6; // 0 account · 1 you · 2 level test · 3 topics · 4 tutorial · 5 result

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-left font-semibold transition ${selected ? "border-accent bg-accent-soft text-ink" : "border-transparent bg-card"}`}
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

const LEVEL_FROM_HABIT: Record<string, LevelId> = { jamais: "debutant", parfois: "intermediaire", souvent: "avance" };

export function OnboardingClient() {
  const router = useRouter();
  const c = useContent();
  const t = useT();
  const ob = c.onboarding;
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [answers, setAnswers] = useState<(number | null)[]>(ob.knowledge.map(() => null));
  const [checked, setChecked] = useState(false);
  const [slide, setSlide] = useState(0);
  // Email of the account already created on this phone ("" = none yet).
  const [accountEmail, setAccountEmail] = useState("");
  const [account, setAccount] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    const saved = getProfile();
    setP(saved);
    setAccountEmail(saved.email);
  }, []);

  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const back = () => (step === 0 ? router.push("/") : setStep(step - 1));
  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  const knowledge = answers.filter((a, i) => a === ob.knowledge[i].answer).length;
  // Test skipped: the level comes from how often they follow the news.
  const level: LevelId = checked ? computeLevel(knowledge, p.followsNews) : (LEVEL_FROM_HABIT[p.followsNews ?? ""] ?? "debutant");
  const intl = isInternational(p);

  const email = p.email.trim();
  const emailOk = EMAIL_RE.test(email);
  const hasAccount = accountEmail !== "" && email === accountEmail;

  // Step 0: the email creates the account. Saved right away, so it is kept even if the player leaves before the end.
  const submitAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk) return;
    setAccount("sending");
    const res = await createAccount(getSessionId(), email, p.firstName.trim());
    // A server problem must never block the onboarding: the email stays on the phone and Boot sends it again on the next visit.
    writeJSON("p27.accountSynced", !!res?.ok);
    if (res?.ok && !hasAccount) track("account_create");
    saveProfile({ ...getProfile(), email, firstName: p.firstName });
    setAccountEmail(email);
    setAccount("idle");
    set({ email });
    next();
  };

  const finish = () => {
    const final: Profile = { ...p, knowledge: checked ? knowledge : 0, level, done: true };
    saveProfile(final);
    // The political position is never asked here, and never sent.
    track("onboarding_finish", {
      level,
      knowledge: checked ? knowledge : null,
      testSkipped: !checked,
      followsNews: final.followsNews,
      voter: final.voter,
      registered: final.registered,
      interests: final.interests,
    });
    addVoix(20, t("Profil complété", "Profile completed"), "profil");
    router.push("/feed");
  };

  const skip = (label?: string, onClick: () => void = next) => (
    <button type="button" onClick={onClick} className="min-h-11 text-center font-semibold text-muted underline underline-offset-4">
      {label ?? t("Passer", "Skip")}
    </button>
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-10 pt-3">
      <div className="flex items-center gap-3">
        <button onClick={back} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fill" aria-label={t("Étape précédente", "Previous step")}>
          <IconBack />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
        {step > 0 && step < STEPS - 1 && (
          <button onClick={() => setStep(STEPS - 1)} className="shrink-0 text-sm font-semibold text-muted underline underline-offset-4">
            {t("Tout passer", "Skip all")}
          </button>
        )}
      </div>

      {step === 0 && (
        <form onSubmit={submitAccount} noValidate className="pop flex flex-col gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Bienvenue", "Welcome")} 👋</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">{hasAccount ? t("Ton compte", "Your account") : t("Crée ton compte", "Create your account")}</h1>
            <p className="mt-2 text-muted">
              {t("Ton email crée ton compte. Ensuite, 4 petites questions pour adapter l'app à toi : celles-là, tu peux les passer.", "Your email creates your account. Then 4 quick questions to adapt the app to you: those you can skip.")}
            </p>
          </div>
          <label htmlFor="ob-email" className="sr-only">
            {t("Ton email", "Your email")}
          </label>
          <input
            id="ob-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            placeholder={t("ton@email.fr", "you@email.com")}
            value={p.email}
            onChange={(e) => set({ email: e.target.value })}
            className="min-h-14 rounded-[12px] border-0 bg-fill px-4 text-lg"
          />
          <p className="-mt-3 text-sm text-muted">{t("Il sert seulement à ton compte : on ne t'écrit pas sans ton accord.", "It's only used for your account: we never write to you without your consent.")}</p>
          <label htmlFor="ob-name" className="sr-only">
            {t("Ton prénom", "Your first name")}
          </label>
          <input
            id="ob-name"
            maxLength={20}
            autoComplete="given-name"
            placeholder={t("Ton prénom (facultatif)", "Your first name (optional)")}
            value={p.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
            className="min-h-14 rounded-[12px] border-0 bg-fill px-4 text-lg"
          />
          <p className="-mt-3 text-sm text-muted">{t("Ton prénom sert seulement à montrer à tes amis qui les défie.", "Your first name is only used to show your friends who challenged them.")}</p>
          {account === "error" && <p className="text-sm text-bad">{t("La création du compte n'a pas marché. Vérifie ta connexion et réessaie.", "Creating your account failed. Check your connection and try again.")}</p>}
          <Button type="submit" disabled={!emailOk || account === "sending"}>
            {account === "sending" ? t("Création…", "Creating…") : hasAccount ? t("Continuer", "Continue") : t("Créer mon compte", "Create my account")}
          </Button>
        </form>
      )}

      {step === 1 && (
        <section className="pop flex flex-col gap-6">
          <h1 className="font-display text-3xl font-extrabold leading-tight">{t("Toi", "About you")}</h1>
          <Group question={ob.voter.question} options={ob.voter.options} value={p.voter} onChange={(v) => set({ voter: v })} />
          {p.voter && p.voter !== "fr" && <p className="-mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold">{ob.voter.help[p.voter]}</p>}
          {p.voter === "fr" && <Group question={ob.registered.question} options={ob.registered.options} value={p.registered} onChange={(v) => set({ registered: v })} />}
          {p.voter === "fr" && p.registered && p.registered !== "oui" && <p className="-mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold">{ob.registered.help}</p>}
          <Group question={ob.followsNews.question} options={ob.followsNews.options} value={p.followsNews} onChange={(v) => set({ followsNews: v })} />
          <Button onClick={next}>{t("Continuer", "Continue")}</Button>
          {skip()}
        </section>
      )}

      {step === 2 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">{t("Petit test, sans pression", "Quick test, no pressure")}</h1>
            <p className="mt-1 text-muted">{t("3 questions pour choisir des défis à ton niveau. Ce n'est pas noté.", "3 questions to pick challenges at your level. It isn't graded.")}</p>
          </div>
          {ob.knowledge.map((q, qi) => (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="mb-2 font-display text-lg font-bold">{q.question}</legend>
              <div className="flex flex-col gap-2">
                {q.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  const state = !checked ? (picked ? "border-accent bg-accent-soft" : "border-transparent bg-card") : oi === q.answer ? "border-ok bg-ok-soft" : picked ? "border-bad bg-bad-soft" : "border-transparent bg-card opacity-60";
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
            <>
              <Button onClick={() => setChecked(true)} disabled={answers.some((a) => a === null)}>
                {t("Voir mes réponses", "See my answers")}
              </Button>
              {skip(t("Passer le test", "Skip the test"))}
            </>
          ) : (
            <>
              <p className="rounded-2xl bg-card px-4 py-3 text-center font-display text-xl font-bold">
                {knowledge}/3 {t("bonnes réponses", "right answers")}
              </p>
              <Button onClick={next}>{t("Continuer", "Continue")}</Button>
            </>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="pop flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">{t("Qu'est-ce qui t'intéresse ?", "What are you interested in?")}</h1>
            <p className="mt-1 text-muted">{t("Ces sujets passent en premier dans ton fil. Tu verras quand même tous les bords.", "These topics come first in your feed. You'll still see every side.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.topics.map((tp) => (
              <Choice
                key={tp.id}
                selected={p.interests.includes(tp.id)}
                onClick={() => setP((x) => ({ ...x, interests: x.interests.includes(tp.id) ? x.interests.filter((i) => i !== tp.id) : [...x.interests, tp.id] }))}
              >
                <span aria-hidden>{tp.emoji}</span> {tp.label}
              </Choice>
            ))}
          </div>
          <Button onClick={next}>{p.interests.length ? t("Continuer", "Continue") : t("Tout m'intéresse", "Everything interests me")}</Button>
        </section>
      )}

      {step === 4 && (
        <section className="pop flex flex-col gap-5">
          <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Comment ça marche", "How it works")}</p>
          <div key={slide} className="pop flex min-h-72 flex-col justify-center gap-3 rounded-[2rem] bg-hero p-6 text-white">
            <p className="text-6xl" aria-hidden>
              {ob.tutorial[slide].emoji}
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-tight">{ob.tutorial[slide].title}</h1>
            <p className="text-[17px] leading-relaxed opacity-90">{ob.tutorial[slide].text}</p>
          </div>
          <div className="flex justify-center gap-2" aria-hidden>
            {ob.tutorial.map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? "w-8 bg-accent" : "w-2 bg-line"}`} />
            ))}
          </div>
          {slide < ob.tutorial.length - 1 ? <Button onClick={() => setSlide(slide + 1)}>{t("Suivant", "Next")}</Button> : <Button onClick={next}>{t("J'ai compris", "Got it")}</Button>}
          {skip()}
        </section>
      )}

      {step === 5 && (
        <section className="pop flex flex-col gap-5">
          <div className="rounded-3xl bg-hero p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Ton niveau de départ", "Your starting level")}</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{ob.levels[level].label}</p>
            <p className="mt-2 opacity-90">{ob.levels[level].text}</p>
            <p className="mt-2 text-sm opacity-75">{t("Tu peux changer le niveau des défis à tout moment.", "You can change the challenge level at any time.")}</p>
          </div>
          <ul className="flex flex-col gap-3">
            <li className="rounded-[14px] bg-card px-4 py-3">
              <strong>{t("Ton fil :", "Your feed:")}</strong>{" "}
              {t(
                "des actus de la gauche, du centre, de la droite et de l'extrême droite, plus des infos neutres, en alternance.",
                "news from the left, the centre, the right and the far right, plus neutral facts, taking turns.",
              )}
            </li>
            {intl && (
              <li className="rounded-[14px] bg-card px-4 py-3">
                🌍 <strong>{t("Mode international :", "International mode:")}</strong>{" "}
                {t("on commence par qui peut voter en France et pourquoi la présidentielle te concerne quand même.", "we start with who can vote in France and why the election still matters to you.")}
              </li>
            )}
            {p.interests.length > 0 && (
              <li className="rounded-[14px] bg-card px-4 py-3">
                <strong>{t("Tes sujets en premier :", "Your topics first:")}</strong> {p.interests.map((id) => c.topicOf(id).label).join(", ")}
              </li>
            )}
            {p.voter === "fr" && p.registered !== "oui" && (
              <li className="rounded-2xl border-2 border-accent bg-accent-soft px-4 py-3">
                <strong>{t("À faire avant le 12 mars 2027 :", "To do before 12 March 2027:")}</strong> {t("vérifier ton inscription sur les listes électorales.", "check that you're on the electoral roll.")}{" "}
                <a href={ob.registered.checkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  service-public.fr ↗
                </a>
              </li>
            )}
          </ul>
          <Button onClick={finish}>{t("Voir mes actus (+20 voix)", "See my news (+20 voix)")}</Button>
        </section>
      )}
    </main>
  );
}
