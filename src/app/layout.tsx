import { Suspense } from "react";
import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { EnTete, Onglets, PiedDePage } from "@/components/en-tete";
import { FournisseurFeuilleCompte } from "@/components/feuille-compte";
import { ThemeVille } from "@/components/theme-ville";
import "./globals.css";

const affiche = Fraunces({ variable: "--font-affiche", subsets: ["latin"] });
const texte = Instrument_Sans({ variable: "--font-texte", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quartea",
  description: "Proposez des idées pour votre quartier et évaluez celles de vos voisins.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${affiche.variable} ${texte.variable} h-full antialiased`}>
      {/* Marge basse : place de la barre d'onglets mobile. */}
      <body className="flex min-h-full flex-col pb-28 font-sans lg:pb-0">
        <a
          href="#contenu"
          className="fixed -top-20 left-2 z-50 rounded-xl bg-encre px-3.5 py-2.5 text-sm font-bold text-white focus:top-2"
        >
          Aller au contenu
        </a>
        <Suspense fallback={null}>
          <ThemeVille />
        </Suspense>
        <Suspense fallback={<div className="h-16 border-b border-trait bg-papier" />}>
          <EnTete />
        </Suspense>

        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
          <FournisseurFeuilleCompte>{children}</FournisseurFeuilleCompte>
        </main>

        <Suspense fallback={null}>
          <PiedDePage />
        </Suspense>
        <Suspense fallback={null}>
          <Onglets />
        </Suspense>
      </body>
    </html>
  );
}
