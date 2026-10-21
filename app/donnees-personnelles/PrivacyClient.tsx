"use client";

import { Card, Page } from "@/components/ui";
import { useContent, useT } from "@/lib/i18n";

export function PrivacyClient() {
  const c = useContent();
  const t = useT();
  return (
    <Page>
      <h1 className="font-display text-3xl font-extrabold">{t("Données personnelles", "Personal data")}</h1>
      <Card className="flex flex-col gap-3 leading-relaxed">
        <p>
          {t(
            `${c.site.appName} est un projet étudiant qui sert à tester une idée : apprendre la présidentielle 2027 en jouant. Tu peux jouer sans compte ; si tu veux, tu en crées un avec ton email, sans mot de passe. Il n'y a ni cookie ni traceur tiers.`,
            `${c.site.appName} is a student project that tests an idea: learning about the 2027 French presidential election by playing. You can play without an account; if you want one, you create it with your email, without a password. There are no cookies and no third-party trackers.`,
          )}
        </p>
        <h2 className="font-display text-lg font-bold">{t("Ce qu'on collecte", "What we collect")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("Des événements d'usage anonymes (pages vues, défis joués, scores, partages), liés à un identifiant aléatoire stocké sur ton téléphone.", "Anonymous usage events (pages viewed, challenges played, scores, shares), linked to a random ID stored on your phone.")}</li>
          <li>{t("Ton prénom, seulement si tu le donnes, pour que tes amis sachent qui les défie.", "Your first name, only if you give it, so your friends know who challenged them.")}</li>
          <li>{t("Ton email, seulement si tu crées un compte (facultatif). On ne t'écrit pas sans ton accord.", "Your email, only if you create an account (optional). We never write to you without your consent.")}</li>
          <li>{t("Ton accord pour recevoir les prochains défis par email, seulement si tu coches la case de consentement.", "Your agreement to receive the next challenges by email, only if you tick the consent box.")}</li>
          <li>{t("Tes pronostics, pour les comparer aux résultats après le vote.", "Your predictions, to compare them with the results after the vote.")}</li>
          <li>{t("Les réponses de ton profil : ton niveau, tes sujets, si tu peux voter en France et si tu es inscrit·e sur les listes.", "Your profile answers: your level, your topics, whether you can vote in France and whether you are on the electoral roll.")}</li>
          <li>{t("Tes voix et le niveau de ta ville.", "Your voix and your city level.")}</li>
          <li>{t("Ton avis sur le jeu (une note et un commentaire facultatif), seulement si tu l'envoies. On ne le cite que si tu as coché la case, avec ton prénom seulement si tu l'as donné.", "Your feedback on the game (a rating and an optional comment), only if you send it. We only quote it if you ticked the box, with your first name only if you gave it.")}</li>
          <li>{t("Quand un·e ami·e joue ton défi, son prénom (s'il l'a donné) et son score s'affichent dans tes duels.", "When a friend plays your challenge, their first name (if they gave it) and score show up in your duels.")}</li>
        </ul>
        <h2 className="font-display text-lg font-bold">{t("Ce qu'on ne collecte jamais", "What we never collect")}</h2>
        <p>
          {t(
            "Ton opinion politique. Si tu indiques ta position dans ton profil, elle reste uniquement sur ton téléphone. Dans « Défends l'autre camp », ta réponse Pour / Contre reste aussi dans ton navigateur. Les 👍 / 👎 du fil sont enregistrés sans aucun identifiant.",
            "Your political opinion. If you set your position in your profile, it stays only on your phone. In \"Defend the other side\", your For / Against answer also stays in your browser. Feed 👍 / 👎 are recorded without any identifier.",
          )}
        </p>
        <h2 className="font-display text-lg font-bold">{t("Pourquoi et combien de temps", "Why and for how long")}</h2>
        <p>
          {t(
            `Uniquement pour savoir si l'idée plaît et l'améliorer. Tout est supprimé à la ${c.site.projectEnd}. Tes voix sont stockées dans ton navigateur : tu peux les effacer depuis ton profil.`,
            `Only to find out whether people like the idea and to improve it. Everything is deleted at the ${c.site.projectEnd}. Your voix are stored in your browser: you can delete them from your profile.`,
          )}
        </p>
        <h2 className="font-display text-lg font-bold">{t("Contact", "Contact")}</h2>
        <p>
          {t("Pour accéder à tes données ou les faire supprimer :", "To access your data or have it deleted:")} <strong className="break-all">{c.site.contactEmail}</strong>
        </p>
      </Card>
    </Page>
  );
}
