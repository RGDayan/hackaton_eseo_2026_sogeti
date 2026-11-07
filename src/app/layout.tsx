import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { BandeauVille } from "@/components/bandeau-ville";
import { ThemeVille } from "@/components/theme-ville";
import "./globals.css";

const affiche = Fraunces({ variable: "--font-affiche", subsets: ["latin"] });
const texte = Instrument_Sans({ variable: "--font-texte", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Place Commune",
  description: "Proposez des idées pour votre quartier et évaluez celles de vos voisins.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${affiche.variable} ${texte.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={null}>
          <ThemeVille />
        </Suspense>
        {/* Bandeau de la ville courante, aux couleurs de la ville (contraste vérifié avec le blanc). */}
        <div className="bg-foret text-white">
          <Suspense fallback={<div className="h-8" />}>
            <BandeauVille />
          </Suspense>
        </div>
        <header className="sticky top-0 z-20 border-b border-trait bg-papier/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
            <Link href="/" className="font-titre text-lg font-semibold whitespace-nowrap text-foret sm:text-xl">
              Place Commune
            </Link>
            <Suspense fallback={<div className="h-10 w-40" />}>
              <Navigation />
            </Suspense>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">{children}</main>

        <footer className="border-t border-trait py-6 text-center text-sm text-gris">
          Place Commune, les idées des habitants pour leur quartier.
        </footer>
      </body>
    </html>
  );
}
