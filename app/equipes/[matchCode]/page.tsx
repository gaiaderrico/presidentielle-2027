import { Suspense } from "react";
import { MatchClient } from "./MatchClient";

export default function MatchPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <MatchClient />
    </Suspense>
  );
}
