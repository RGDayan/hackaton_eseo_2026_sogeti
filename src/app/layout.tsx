import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { MenuUtilisateur } from "@/components/menu-utilisateur";
import { SelecteurVille } from "@/components/selecteur-ville";
import { NomVille, ThemeVille } from "@/components/theme-ville";
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
        <header className="sticky top-0 z-20 border-b border-trait bg-papier/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-baseline gap-2">
              <Link href="/" className="font-titre text-xl font-semibold text-foret">
                Place Commune
              </Link>
              <Suspense fallback={null}>
                <span className="hidden md:inline">
                  <NomVille />
                </span>
              </Suspense>
            </div>
            <nav className="flex flex-wrap items-center justify-end gap-3">
              <Suspense fallback={<div className="h-9 w-40" />}>
                <SelecteurVille />
              </Suspense>
              <Suspense fallback={<div className="h-10 w-24" />}>
                <MenuUtilisateur />
              </Suspense>
              <Link href="/idees/nouvelle" className="bouton-plein">
                Proposer<span className="hidden sm:inline"> une idée</span>
              </Link>
            </nav>
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
