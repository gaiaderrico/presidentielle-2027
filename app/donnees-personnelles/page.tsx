import type { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = { title: "Données personnelles · Présidentielle 2027 : le jeu" };

export default function PrivacyPage() {
  return <PrivacyClient />;
}
