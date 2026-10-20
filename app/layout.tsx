import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Boot } from "@/components/Boot";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { LevelUp } from "@/components/LevelUp";
import { TopBar } from "@/components/TopBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "polis · Présidentielle 2027",
  description: "polis : comprends la présidentielle 2027 en 5 minutes, fais grandir ta ville et défie tes potes. Neutre, gratuit, sans inscription. Aussi en anglais.",
  applicationName: "polis",
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
        <Boot />
      </body>
    </html>
  );
}
