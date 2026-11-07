import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCategorie } from "@/components/idee-card";
import { Anneau, BarresHorizontales } from "@/components/graphiques";
import { getEspacePerso, getTableauDeBord, type IdeeResume } from "@/lib/dashboard";
import { getUtilisateur } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tableau de bord | Place Commune",
  description: "Les idées, les votes et les catégories qui comptent dans votre quartier, en un coup d'œil.",
};

const nombre = new Intl.NumberFormat("fr-FR");
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

const pluriel = (n: number, mot: string) => `${nombre.format(n)} ${mot}${n > 1 ? "s" : ""}`;
const signe = (n: number) => (n > 0 ? `+${n}` : String(n));

export default function PageTableauDeBord() {
  return (
    <>
      <section className="py-6 sm:py-10 lg:py-14">
        <h1 className="font-titre text-3xl leading-tight font-semibold text-foret sm:text-5xl lg:text-6xl">Le quartier en chiffres.</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed sm:mt-4 sm:text-lg text-gris">
          Ce qui se propose, ce qui se vote et ce qui réunit le plus d&apos;habitants.
        </p>
        <a href="#mes-favorites" className="bouton-contour mt-5 w-full sm:mt-6 sm:w-auto">
          Mes idées favorites
        </a>
      </section>

      <Suspense fallback={<SqueletteSynthese />}>
        <Synthese />
      </Suspense>

      <Suspense fallback={<div className="mt-10 h-48 animate-pulse rounded-2xl bg-trait/50" />}>
        <EspacePerso />
      </Suspense>
    </>
  );
}

async function Synthese() {
  const d = await getTableauDeBord();

  const totalVotes = d.votesPour + d.votesContre;
  const pctFavorables = totalVotes === 0 ? 0 : Math.round((d.votesPour / totalVotes) * 100);

  const tuiles = [
    {
      libelle: "Idées proposées",
      valeur: nombre.format(d.idees),
      detail: `${pluriel(d.nouvellesCetteSemaine, "nouvelle")} cette semaine`,
    },
    {
      libelle: "Votes exprimés",
      valeur: nombre.format(totalVotes),
      detail: `${nombre.format(d.votesPour)} pour, ${nombre.format(d.votesContre)} contre`,
    },
    {
      libelle: "Voisins inscrits",
      valeur: nombre.format(d.voisins),
      detail: "ont rejoint la plateforme",
    },
    {
      libelle: "Votes par idée",
      valeur: decimal.format(d.idees === 0 ? 0 : totalVotes / d.idees),
      detail: `${pctFavorables} % d'avis favorables`,
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
                    <BarreVotes pour={idee.votesPour} contre={idee.votesContre} />
                    <p className="mt-1.5 text-xs text-gris">
                      {idee.votesPour} pour, {idee.votesContre} contre, score {signe(idee.score)}
                    </p>
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
                detail: `${pluriel(c.idees, "idée")}, ${pluriel(c.votes, "vote")}`,
                href: `/?categorie=${encodeURIComponent(c.slug)}`,
              }))}
            />
          )}
        </Bloc>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[2fr_3fr]">
        <Bloc titre="La tendance du quartier">
          <Anneau pour={d.votesPour} contre={d.votesContre} />
          <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-foret" aria-hidden />
              Pour : {nombre.format(d.votesPour)}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-tomate" aria-hidden />
              Contre : {nombre.format(d.votesContre)}
            </li>
          </ul>
        </Bloc>

        <Bloc titre="Les idées par quartier">
          {d.parQuartier.every((q) => q.idees === 0) ? (
            <Vide />
          ) : (
            <BarresHorizontales
              lignes={d.parQuartier.map((q) => ({
                libelle: q.nom,
                valeur: q.idees,
                couleur: "#1f4d3a",
                detail: `${pluriel(q.idees, "idée")}, ${pluriel(q.votes, "vote")}`,
                href: `/?quartier=${encodeURIComponent(q.slug)}`,
              }))}
            />
          )}
        </Bloc>
      </div>
    </>
  );
}

async function EspacePerso() {
  const utilisateur = await getUtilisateur();

  if (!utilisateur) {
    return (
      <section id="mes-favorites" className="mt-8 scroll-mt-24 sm:mt-10">
        <h2 className="font-titre text-2xl font-semibold sm:text-3xl">Vos idées favorites</h2>
        <div className="mt-4 rounded-2xl border border-dashed border-trait p-6 text-center sm:p-10">
          <p className="font-titre text-xl font-semibold">Retrouvez les idées que vous soutenez.</p>
          <p className="mt-2 text-sm text-gris">
            Choisissez un pseudo, votez « pour » une idée, et elle apparaît ici.
          </p>
          <Link href="/connexion?next=/dashboard" className="bouton-plein mt-4 w-full sm:w-auto">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const perso = await getEspacePerso(utilisateur.id);

  return (
    <section id="mes-favorites" className="mt-8 scroll-mt-24 sm:mt-10">
      <h2 className="font-titre text-2xl font-semibold sm:text-3xl">Vos idées favorites</h2>
      <p className="mt-2 max-w-2xl text-gris">
        {utilisateur.nickname}, vous soutenez {pluriel(perso.favorites.length, "idée")} et en avez proposé{" "}
        {perso.miennes.length}, qui {perso.miennes.length > 1 ? "ont" : "a"} réuni {pluriel(perso.votesRecus, "vote")}.
        Une idée est favorite dès que vous votez « pour ».
      </p>

      {perso.favorites.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-trait p-6 text-center sm:p-10">
          <p className="font-titre text-xl font-semibold">Aucune favorite pour l&apos;instant.</p>
          <p className="mt-2 text-sm text-gris">Parcourez les idées et votez « pour » celles qui vous plaisent.</p>
          <Link href="/" className="bouton-plein mt-4 w-full sm:w-auto">
            Voir les idées
          </Link>
        </div>
      ) : (
        <ListeIdees idees={perso.favorites} />
      )}

      <h3 className="mt-8 font-titre text-xl font-semibold sm:mt-10 sm:text-2xl">Vos propositions</h3>
      {perso.miennes.length === 0 ? (
        <p className="mt-2 text-sm text-gris">
          Vous n&apos;avez pas encore proposé d&apos;idée.{" "}
          <Link href="/idees/nouvelle" className="font-semibold text-foret hover:underline">
            Lancer la première
          </Link>
        </p>
      ) : (
        <ListeIdees idees={perso.miennes} />
      )}
    </section>
  );
}

function ListeIdees({ idees }: { idees: IdeeResume[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {idees.map((idee) => (
        <li key={idee.id} className="rounded-2xl border border-trait bg-carte p-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gris">
            <BadgeCategorie nom={idee.categorie.nom} couleur={idee.categorie.couleur} />
            <span>{idee.localisation.nom}</span>
          </div>
          <Link
            href={`/idees/${idee.id}`}
            className="mt-2 block font-titre text-base leading-snug sm:text-lg font-semibold hover:text-foret hover:underline"
          >
            {idee.titre}
          </Link>
          <BarreVotes pour={idee.votesPour} contre={idee.votesContre} />
          <p className="mt-1.5 text-xs text-gris">
            {idee.votesPour} pour, {idee.votesContre} contre
          </p>
        </li>
      ))}
    </ul>
  );
}

function BarreVotes({ pour, contre }: { pour: number; contre: number }) {
  const total = pour + contre;
  return (
    <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-trait/60" aria-hidden>
      {total > 0 && (
        <>
          <div className="bg-foret" style={{ width: `${(pour / total) * 100}%` }} />
          <div className="bg-tomate" style={{ width: `${(contre / total) * 100}%` }} />
        </>
      )}
    </div>
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