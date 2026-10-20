import { Suspense } from "react";
import { CHALLENGE_TYPES } from "@/lib/content";
import { PlayClient } from "./PlayClient";

export function generateStaticParams() {
  return CHALLENGE_TYPES.map((type) => ({ type }));
}

export default function PlayPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <PlayClient />
    </Suspense>
  );
}
