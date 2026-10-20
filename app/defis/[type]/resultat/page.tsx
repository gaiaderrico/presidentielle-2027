import { CHALLENGE_TYPES } from "@/lib/content";
import { ResultClient } from "./ResultClient";

export function generateStaticParams() {
  return CHALLENGE_TYPES.map((type) => ({ type }));
}

export default function ResultPage() {
  return <ResultClient />;
}
