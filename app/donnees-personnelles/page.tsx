import type { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = { title: "Données personnelles · polis" };

export default function PrivacyPage() {
  return <PrivacyClient />;
}
