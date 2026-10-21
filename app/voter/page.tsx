import { Suspense } from "react";
import { VoterClient } from "./VoterClient";

export default function VoterPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <VoterClient />
    </Suspense>
  );
}
