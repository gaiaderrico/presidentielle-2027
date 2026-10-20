import { Suspense } from "react";
import { HomeClient } from "./HomeClient";

export default function Home() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <HomeClient />
    </Suspense>
  );
}
