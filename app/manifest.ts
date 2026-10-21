import type { MetadataRoute } from "next";

// "Add to home screen": the game opens full screen, like an app, on the player's home page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "polis · Présidentielle 2027",
    short_name: "polis",
    description: "Comprends la présidentielle 2027 en 5 minutes, fais grandir ta ville et défie tes potes.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#0b1f5c",
    icons: [{ src: "/brand/polis-app-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any" }],
  };
}
