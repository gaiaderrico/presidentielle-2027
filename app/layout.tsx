import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { BadgeToast } from "@/components/BadgeToast";
import { Boot } from "@/components/Boot";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { LevelUp } from "@/components/LevelUp";
import { TopBar } from "@/components/TopBar";
import "./globals.css";

const description = "polis : comprends la présidentielle 2027 en 5 minutes, fais grandir ta ville et défie tes potes. Neutre, gratuit, sans inscription. Aussi en anglais.";

export const metadata: Metadata = {
  // Absolute URLs for the link preview image (opengraph-image.tsx).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "polis · Présidentielle 2027",
  description,
  applicationName: "polis",
  openGraph: { title: "polis · La présidentielle 2027 en 5 minutes", description, siteName: "polis", locale: "fr_FR", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "polis", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <Suspense fallback={<div className="h-14" />}>
          <TopBar />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <Footer />
          <BottomNav />
        </Suspense>
        <LevelUp />
        <BadgeToast />
        <Boot />
      </body>
    </html>
  );
}
