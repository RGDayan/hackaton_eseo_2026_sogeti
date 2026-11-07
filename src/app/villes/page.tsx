import { Suspense } from "react";
import type { Metadata } from "next";
import { choisirVille } from "@/app/actions";
import { getVilleCourante, listerVilles } from "@/lib/ville";

export const metadata: Metadata = { title: "Choisir sa ville · Place Commune" };

export default function PageVilles() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="font-titre text-3xl font-semibold text-foret sm:text-4xl">Choisissez votre ville</h1>
      <p className="mt-2 text-gris">Les idées, la carte et les chiffres affichés seront ceux de cette ville.</p>
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-trait/50" />}>
        <Liste />
      </Suspense>
    </div>
  );
}

async function Liste() {
  const [villes, courante] = await Promise.all([listerVilles(), getVilleCourante()]);

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {villes.map((v) => {
        const actuelle = v.slug === courante.slug;
        return (
          <li key={v.slug}>
            {/* Un formulaire par ville : fonctionne sans JavaScript. */}
            <form action={choisirVille}>
              <input type="hidden" name="ville" value={v.slug} />
              <button
                type="submit"
                aria-current={actuelle ? "true" : undefined}
                className={`flex w-full items-center gap-4 rounded-2xl border bg-carte p-5 text-left transition-colors hover:border-foret ${
                  actuelle ? "border-foret ring-2 ring-foret/30" : "border-trait"
                }`}
              >
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-full border-4 border-carte shadow"
                  style={{ backgroundColor: v.couleurPrincipale }}
                />
                <span>
                  <span className="block font-titre text-lg font-semibold">{v.nom}</span>
                  <span className="text-sm text-gris">{actuelle ? "Ville actuelle" : "Choisir cette ville"}</span>
                </span>
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
