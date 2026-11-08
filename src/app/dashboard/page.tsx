import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCategorie } from "@/components/idee-card";
import { BarresHorizontales } from "@/components/graphiques";
import { getTableauDeBord } from "@/lib/dashboard";
import { getVilleCourante } from "@/lib/ville";

export const metadata: Metadata = {
  title: "Tableau de bord | Quartea",
  description: "Les idées, les votes et les catégories qui comptent dans votre quartier, en un coup d'œil.",
};

const nombre = new Intl.NumberFormat("fr-FR");
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

const pluriel = (n: number, mot: string) => `${nombre.format(n)} ${mot}${n > 1 ? "s" : ""}`;

export default function PageTableauDeBord() {
  return (
    <>
      <section className="py-6 sm:py-10 lg:py-14">
        <Suspense fallback={<p className="h-5" />}>
          <NomVilleCourante />
        </Suspense>
        <h1 className="font-titre text-3xl leading-tight font-semibold text-foret sm:text-5xl lg:text-6xl">La ville en chiffres.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed sm:mt-4 sm:text-lg text-gris">
          Ce qui se propose, ce qui se vote et ce qui réunit le plus d&apos;habitants.
        </p>
      </section>

      <Suspense fallback={<SqueletteSynthese />}>
        <Synthese />
      </Suspense>
    </>
  );
}

async function NomVilleCourante() {
  const ville = await getVilleCourante();
  return <p className="mb-2 text-sm font-semibold tracking-wide text-foret uppercase">{ville.nom}</p>;
}

async function Synthese() {
  const ville = await getVilleCourante();
  const d = await getTableauDeBord(ville.id);

  const totalSoutiens = d.votesPour;

  const tuiles = [
    {
      libelle: "Idées proposées",
      valeur: nombre.format(d.idees),
      detail: `${pluriel(d.nouvellesCetteSemaine, "nouvelle")} cette semaine`,
    },
    {
      libelle: "Soutiens",
      valeur: nombre.format(totalSoutiens),
      detail: "apportés aux idées des voisins",
    },
    {
      libelle: "Voisins inscrits",
      valeur: nombre.format(d.voisins),
      detail: "ont rejoint la plateforme",
    },
    {
      libelle: "Soutiens par idée",
      valeur: decimal.format(d.idees === 0 ? 0 : totalSoutiens / d.idees),
      detail: "en moyenne",
    },
  ];

  const topCategories = d.parCategorie.slice(0, 5);

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tuiles.map((t) => (
          <div key={t.libelle} className="rounded-2xl border border-trait bg-carte p-4 sm:p-5">
            <dt className="text-sm font-semibold text-gris">{t.libelle}</dt>
            <dd className="mt-1 font-titre text-3xl font-semibold sm:text-4xl">{t.valeur}</dd>
            <dd className="mt-1 text-xs text-gris sm:text-sm">{t.detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        <Bloc titre="Les 5 idées les mieux notées">
          {d.topIdees.length === 0 ? (
            <Vide />
          ) : (
            <ol className="space-y-5">
              {d.topIdees.map((idee, i) => (
                <li key={idee.id} className="flex gap-3 sm:gap-4">
                  <span className="w-5 shrink-0 font-titre text-2xl sm:w-6 sm:text-3xl leading-none font-semibold text-foret/40" aria-hidden>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gris">
                      <BadgeCategorie nom={idee.categorie.nom} couleur={idee.categorie.couleur} />
                      <span>{idee.localisation.nom}</span>
                    </div>
                    <Link
                      href={`/idees/${idee.id}`}
                      className="mt-1.5 block font-titre text-base leading-snug sm:text-lg font-semibold hover:text-foret hover:underline"
                    >
                      {idee.titre}
                    </Link>
                    <p className="mt-1.5 text-xs text-gris">{pluriel(idee.votesPour, "soutien")}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Bloc>

        <Bloc titre="Les 5 catégories les plus actives">
          {topCategories.every((c) => c.idees === 0) ? (
            <Vide />
          ) : (
            <BarresHorizontales
              lignes={topCategories.map((c) => ({
                libelle: c.nom,
                valeur: c.idees,
                couleur: c.couleur,
                detail: `${pluriel(c.idees, "idée")}, ${pluriel(c.votes, "soutien")}`,
                href: `/?categorie=${encodeURIComponent(c.slug)}`,
              }))}
            />
          )}
        </Bloc>
      </div>

      <div className="mt-4 sm:mt-6">
        <Bloc titre="Les idées par quartier">
          {d.parQuartier.every((q) => q.idees === 0) ? (
            <Vide />
          ) : (
            <BarresHorizontales
              lignes={d.parQuartier.map((q) => ({
                libelle: q.nom,
                valeur: q.idees,
                couleur: "#1f4d3a",
                detail: `${pluriel(q.idees, "idée")}, ${pluriel(q.votes, "soutien")}`,
                href: `/?quartier=${encodeURIComponent(q.slug)}`,
              }))}
            />
          )}
        </Bloc>
      </div>
    </>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-trait bg-carte p-4 sm:p-6">
      <h2 className="mb-4 font-titre text-lg font-semibold sm:mb-5 sm:text-xl">{titre}</h2>
      {children}
    </section>
  );
}

function Vide() {
  return <p className="text-sm text-gris">Rien à afficher pour l&apos;instant : les premières idées arrivent.</p>;
}

function SqueletteSynthese() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-trait/50 sm:h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-trait/50" />
        <div className="h-64 rounded-2xl bg-trait/50" />
      </div>
    </div>
  );
}