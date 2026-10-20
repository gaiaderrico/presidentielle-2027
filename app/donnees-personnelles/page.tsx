import type { Metadata } from "next";
import { Card, Page } from "@/components/ui";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Données personnelles · Présidentielle 2027 : le jeu" };

export default function PrivacyPage() {
  return (
    <Page>
      <h1 className="font-display text-3xl font-extrabold">Données personnelles</h1>
      <Card className="flex flex-col gap-3 leading-relaxed">
        <p>
          {site.appName} est un <strong>projet étudiant</strong> qui sert à tester une idée : apprendre la présidentielle 2027 en jouant. Il n&apos;y a ni compte, ni
          cookie, ni traceur tiers.
        </p>
        <h2 className="font-display text-lg font-bold">Ce qu&apos;on collecte</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Des événements d&apos;usage anonymes (pages vues, défis joués, scores, partages), liés à un identifiant aléatoire stocké sur ton téléphone.</li>
          <li>Ton prénom, seulement si tu le donnes, pour que tes amis sachent qui les défie.</li>
          <li>Ton email, seulement si tu coches la case de consentement.</li>
          <li>Tes pronostics, pour les comparer aux résultats après le vote.</li>
          <li>Les réponses de ton profil : ton niveau, tes sujets, si tu as déjà voté et si tu es inscrit·e sur les listes.</li>
          <li>Tes voix et le niveau de ta ville.</li>
        </ul>
        <h2 className="font-display text-lg font-bold">Ce qu&apos;on ne collecte jamais</h2>
        <p>
          Ton opinion politique. Si tu indiques ta position dans ton profil, elle reste uniquement sur ton téléphone. Dans « Défends l&apos;autre camp », ta réponse Pour / Contre reste aussi dans ton navigateur. Les 👍 / 👎 du feed sont enregistrés sans
          aucun identifiant.
        </p>
        <h2 className="font-display text-lg font-bold">Pourquoi et combien de temps</h2>
        <p>
          Uniquement pour savoir si l&apos;idée plaît et l&apos;améliorer. Tout est supprimé à la {site.projectEnd}. Tes voix sont stockées dans ton
          navigateur : tu peux les effacer en vidant les données du site.
        </p>
        <h2 className="font-display text-lg font-bold">Contact</h2>
        <p>
          Pour accéder à tes données ou les faire supprimer : <strong className="break-all">{site.contactEmail}</strong>
        </p>
      </Card>
    </Page>
  );
}
