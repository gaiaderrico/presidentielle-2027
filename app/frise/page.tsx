import { Suspense } from "react";
import { FriseClient } from "./FriseClient";

export default function FrisePage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <FriseClient />
    </Suspense>
  );
}
