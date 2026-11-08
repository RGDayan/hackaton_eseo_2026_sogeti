import { Suspense } from "react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { choisirVille } from "@/app/actions";
import { Icone } from "@/components/icone";
import { Monogramme } from "@/components/monogramme";
import { nomCourt, pluriel } from "@/lib/format";
import { getStatistiques } from "@/lib/queries";
import { getVilleCourante, listerVilles } from "@/lib/ville";

export const metadata: Metadata = { title: "Choisir sa ville · Quartea" };

export default function PageVilles() {
  return (
    <div className="mx-auto max-w-4xl pt-5 lg:pt-10">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-gris hover:text-encre">
        <Icone nom="retour" taille={16} />
        Retour
      </Link>
      <h1 className="mt-1 mb-1.5 font-titre text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] lg:text-5xl">
        Choisissez votre ville
      </h1>
      <p className="mb-5 max-w-xl text-[15px] leading-[1.45] text-gris">
        Les idées, la carte et les chiffres affichés seront ceux de cette ville. Votre compte reste le même.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[22px] bg-sable/60" />}>
        <Liste />
      </Suspense>
      <p className="mt-[18px] text-center text-[13.5px] leading-[1.45] text-gris">
        Votre ville n&apos;est pas encore là ? Quartea ouvre ville par ville.
      </p>
    </div>
  );
}

async function Liste() {
  const [villes, courante] = await Promise.all([listerVilles(), getVilleCourante()]);
  const stats = await Promise.all(villes.map((v) => getStatistiques(v.id)));

  return (
    <ul className="grid gap-3.5 md:grid-cols-2 md:gap-5">
      {villes.map((v, i) => {
        const actuelle = v.slug === courante.slug;
        // Chaque carte prend les couleurs de sa ville.
        const couleurs = {
          "--color-foret": v.couleurPrincipale,
          "--color-foret-fonce": v.couleurPrincipaleFoncee,
          "--color-soleil": v.couleurAccent,
        } as CSSProperties;
        return (
          <li key={v.slug} style={couleurs}>
            <article
              className={`overflow-hidden rounded-[22px] bg-carte shadow-[0_4px_14px_rgb(28_43_36/0.05)] ${
                actuelle ? "border-2 border-foret" : "border border-trait"
              }`}
            >
              <div className="relative h-[120px] overflow-hidden bg-foret">
                <span aria-hidden className="absolute -top-16 -right-10 size-52 rounded-full bg-soleil opacity-30" />
                <span aria-hidden className="absolute top-6 left-1/3 size-24 rounded-full border-[14px] border-white/10" />
                <span aria-hidden className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-foret-fonce/55" />
                {actuelle && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-[5px] rounded-full bg-carte py-[5px] pr-[11px] pl-2 text-[12.5px] font-bold text-encre">
                    <Icone nom="valider" taille={14} epaisseur={3} />
                    Ville actuelle
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <div className="-mt-[22px] flex items-end gap-3">
                  <Monogramme nom={v.nom} logo={v.logoUrl} taille="grand" fond="var(--color-carte)" />
                  <h2 className="pb-0.5 font-titre text-[19px] leading-[1.15] font-semibold">{v.nom}</h2>
                </div>
                <p className="text-sm text-gris">
                  <strong className="text-encre">
                    {pluriel(stats[i].idees, "idée active", "idées actives")}
                  </strong>{" "}
                  · {pluriel(stats[i].voisins, "participant")}
                </p>
                {actuelle ? (
                  <Link
                    href="/"
                    aria-current="true"
                    className="flex h-[50px] items-center justify-center rounded-full border border-trait text-[15.5px] font-bold hover:border-foret"
                  >
                    Rester sur {nomCourt(v.nom)}
                  </Link>
                ) : (
                  // Un formulaire par ville : fonctionne sans JavaScript, sans envoi automatique (WCAG 3.2.2).
                  <form action={choisirVille}>
                    <input type="hidden" name="ville" value={v.slug} />
                    <button
                      type="submit"
                      className="h-[50px] w-full rounded-full bg-foret text-[15.5px] font-bold text-white hover:bg-foret-fonce"
                    >
                      Choisir cette ville<span className="sr-only"> : {v.nom}</span>
                    </button>
                  </form>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
