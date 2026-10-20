import { Suspense } from "react";
import { CreateMatchClient } from "./CreateMatchClient";

export default function EquipesPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <CreateMatchClient />
    </Suspense>
  );
}
