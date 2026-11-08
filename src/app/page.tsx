import { Suspense } from "react";
import Link from "next/link";
import { CarteIdees } from "@/components/carte-lazy";
import { Carrousel } from "@/components/carrousel";
import { Filtres } from "@/components/filtres";
import { Icone } from "@/components/icone";
import { IdeeCard, IdeeCompacte } from "@/components/idee-card";
import { nomCourt, pluriel } from "@/lib/format";
import {
  getMesFavoris,
  getMesVotes,
  getReferentiels,
  lireFiltres,
  listerEpingles,
  listerSuggestions,
  listerTendances,
  type Filtres as FiltresActifs,
} from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";
import { getVilleCourante } from "@/lib/ville";

type Params = PageProps<"/">["searchParams"];
type Vue = "liste" | "carte";

const lireVue = (params: Awaited<Params>): Vue => (params.vue === "carte" ? "carte" : "liste");

export default function Accueil({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="-mx-1 mt-3 h-[400px] animate-pulse rounded-[28px] bg-foret/80 sm:mx-0 lg:h-[380px]" />}>
        <Hero />
      </Suspense>

      <Suspense fallback={null}>
        <Decouvrir searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<SqueletteFil />}>
        <Fil searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** Bandeau d'accueil aux couleurs de la ville, avec les deux actions principales. */
function Hero() {
  return (
    <section
      aria-labelledby="titre-hero"
      className="relative -mx-1 mt-3 overflow-hidden rounded-[28px] bg-foret text-white sm:mx-0 lg:mt-6"
    >
      {/* Décor : dégradé de la ville et formes douces de la couleur d'accent. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -top-24 -right-20 size-80 rounded-full bg-soleil opacity-25 lg:size-[28rem]" />
        <span className="absolute top-24 -right-6 size-40 rounded-full border-[22px] border-white/10 lg:top-16 lg:right-40" />
        <span className="absolute -bottom-16 -left-10 size-56 rounded-full bg-white/6" />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--color-foret-fonce)_70%,transparent)_100%)]" />
      </div>

      <div className="relative flex min-h-[400px] flex-col gap-3.5 px-5 pt-5 pb-6 lg:min-h-[380px] lg:gap-5 lg:px-12 lg:py-10">
        <div className="mt-auto flex max-w-2xl flex-col gap-3.5 lg:gap-5">
          <h1
            id="titre-hero"
            className="font-titre text-[38px] leading-[1.04] font-semibold tracking-[-0.02em] text-balance lg:text-6xl"
          >
            Votre quartier s&apos;invente ici.
          </h1>
          <p className="max-w-[310px] text-base leading-[1.45] lg:max-w-lg lg:text-lg">
            Proposez une idée, soutenez celles de vos voisins, suivez la réponse de la ville.
          </p>
          {/* Empilés sur mobile (aucun texte tronqué), côte à côte dès que la place le permet. */}
          <div className="mt-1 flex flex-col gap-2.5 min-[420px]:flex-row lg:mt-2">
            <Link
              href="/idees/nouvelle"
              className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold whitespace-nowrap text-foret-fonce shadow-[0_4px_14px_rgb(0_0_0/0.18)] transition-colors hover:bg-[#fbf3e2] min-[420px]:flex-1 lg:flex-none"
            >
              <Icone nom="plus" taille={18} epaisseur={2.6} />
              Proposer une idée
            </Link>
            <Link
              href="/?vue=carte#fil"
              className="flex h-[50px] items-center justify-center gap-2 rounded-full border-[1.5px] border-white/85 px-6 text-[15px] font-bold whitespace-nowrap transition-colors hover:bg-white/12 min-[420px]:flex-1 lg:flex-none"
            >
              <Icone nom="carte" taille={17} />
              Explorer la carte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** « En ce moment » : affiché tant qu'aucun filtre n'est actif. */
async function Decouvrir({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const f = lireFiltres(params);
  if (f.q || f.quartier || f.categorie || f.tag || f.page > 1 || lireVue(params) === "carte") return null;

  const ville = await getVilleCourante();
  const tendances = await listerTendances(ville.id, 8);
  if (tendances.length === 0) return null;

  return (
    <section aria-labelledby="titre-moment" className="pt-7 lg:pt-12">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="titre-moment" className="titre-section lg:text-3xl">
            En ce moment
          </h2>
          <p className="mt-[3px] text-[13.5px] text-gris">Les idées les plus soutenues</p>
        </div>
        <Link
          href="/?tri=mieux-notees#fil"
          className="flex min-h-11 items-center text-sm font-bold whitespace-nowrap text-foret-fonce hover:underline"
        >
          Tout voir
        </Link>
      </div>
      <Carrousel libelle="Idées les plus soutenues">
        {tendances.map((idee, i) => (
          <li key={idee.id} className="flex snap-start">
            <IdeeCompacte idee={idee} rang={i + 1} />
          </li>
        ))}
      </Carrousel>
    </section>
  );
}

async function Fil({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const filtres = lireFiltres(params);
  const vue = lireVue(params);
  const ville = await getVilleCourante();
  const [{ suggestions, total, pages }, epingles, referentiels, utilisateur] = await Promise.all([
    listerSuggestions(filtres, ville.id),
    listerEpingles(filtres, ville.id),
    getReferentiels(ville.id),
    getUtilisateur(),
  ]);
  const ids = suggestions.map((s) => s.id);
  const [mesVotes, mesFavoris] = await Promise.all([getMesVotes(utilisateur?.id, ids), getMesFavoris(utilisateur?.id, ids)]);

  const { localisations, categories, tags } = referentiels;
  // Carte centrée sur le quartier filtré, sinon sur la ville.
  const quartier = localisations.find((l) => l.slug === filtres.quartier);
  const categorie = categories.find((c) => c.slug === filtres.categorie);
  const centre = quartier ?? ville;
  const zoom = quartier ? 14 : ville.zoom;
  const filtre = Boolean(filtres.q || filtres.quartier || filtres.categorie || filtres.tag);
  const villeVide = total === 0 && !filtre;
  const court = nomCourt(ville.nom);

  if (villeVide) {
    return (
      <section aria-labelledby="titre-fil" id="fil" className="scroll-mt-20 pt-8">
        <h2 id="titre-fil" className="titre-section mb-3">
          Les idées de {court}
        </h2>
        <div className="carte flex flex-col items-center gap-2.5 rounded-3xl px-5 pt-7 pb-6 text-center lg:py-12">
          <div aria-hidden className="relative h-28 w-[150px]">
            <span className="absolute bottom-0 left-0 h-11 w-[150px] rounded-[50%] bg-sable-clair" />
            <span className="absolute top-1.5 left-[26px] size-[84px] rounded-full bg-soleil opacity-45" />
            <span className="absolute top-[18px] left-[54px] h-[62px] w-[46px] -rotate-45 rounded-[50%_50%_50%_0] border-[3px] border-carte bg-foret shadow-[0_4px_10px_rgb(0_0_0/0.15)]" />
            <span className="absolute top-8 left-[69px] text-white">
              <Icone nom="plus" taille={22} epaisseur={3} />
            </span>
          </div>
          <p className="mt-1.5 font-titre text-[22px] leading-tight font-semibold text-balance">
            Soyez le premier à proposer
          </p>
          <p className="max-w-[280px] text-[14.5px] leading-[1.45] text-gris">
            Aucune idée n&apos;a encore été déposée à {court}. La vôtre ouvrira le fil, et vos voisins pourront la
            soutenir.
          </p>
          <Link href="/idees/nouvelle" className="bouton-plein mt-2 h-[50px] w-full text-[15px] sm:w-auto">
            <Icone nom="plus" taille={18} epaisseur={2.6} />
            Proposer la première idée
          </Link>
        </div>
      </section>
    );
  }

  const lienVue = (v: Vue) => {
    const p = new URLSearchParams();
    for (const cle of ["q", "quartier", "categorie", "tag"] as const) if (filtres[cle]) p.set(cle, filtres[cle]);
    if (filtres.tri !== "recentes") p.set("tri", filtres.tri);
    if (v === "carte") p.set("vue", "carte");
    const requete = p.toString();
    return `/${requete ? `?${requete}` : ""}#fil`;
  };

  return (
    <section aria-labelledby="titre-fil" id="fil" className="scroll-mt-20 pt-8 lg:pt-12">
      <h2 id="titre-fil" className="titre-section mb-3 lg:text-3xl">
        Toutes les idées
      </h2>
      <Filtres
        actifs={filtres}
        vue={vue}
        quartiers={localisations.map((l) => ({ valeur: l.slug, libelle: l.nom }))}
        categories={categories.map((c) => ({ valeur: c.slug, libelle: c.nom }))}
        tags={tags.map((t) => ({ valeur: t.nom, libelle: `#${t.nom}` }))}
      />

      <div className="mt-3.5 mb-3 flex items-center justify-between gap-2">
        <p role="status" className="text-sm text-gris">
          <strong className="text-encre">{pluriel(total, "idée")}</strong> ·{" "}
          {filtres.tri === "mieux-notees" ? "les mieux notées" : "les plus récentes"}
        </p>
        {/* Bascule Liste / Carte : sur grand écran, les deux sont affichées côte à côte. */}
        <nav aria-label="Affichage" className="flex rounded-full bg-sable p-[3px] lg:hidden">
          {(["liste", "carte"] as const).map((v) => (
            <Link
              key={v}
              href={lienVue(v)}
              scroll={false}
              aria-current={vue === v ? "true" : undefined}
              className={`flex h-[38px] items-center gap-[5px] rounded-full px-[13px] text-[13.5px] font-semibold whitespace-nowrap ${
                vue === v ? "bg-carte shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : ""
              }`}
            >
              <Icone nom={v} taille={16} />
              {v === "liste" ? "Liste" : "Carte"}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <aside
          aria-label="Carte des idées"
          className={`lg:sticky lg:top-24 lg:order-2 lg:block lg:self-start ${vue === "carte" ? "" : "hidden"}`}
        >
          <div className="isolate h-[440px] overflow-hidden rounded-[20px] border border-trait lg:h-[calc(100vh-8rem)]">
            <CarteIdees key={ville.slug} epingles={epingles} centre={centre} zoom={zoom} />
          </div>
          <Link
            href={lienVue("liste")}
            scroll={false}
            className="mt-2.5 flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-foret-fonce lg:hidden"
          >
            <Icone nom="liste" taille={16} />
            Voir les {pluriel(total, "idée")} en liste
          </Link>
        </aside>

        <div className={`min-w-0 lg:order-1 lg:block ${vue === "liste" ? "" : "hidden"}`}>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-trait-fonce bg-carte px-5 py-7 text-center">
              <div aria-hidden className="relative mb-1 h-[92px] w-[120px]">
                <span className="absolute top-3.5 left-2 size-[76px] rounded-full bg-soleil opacity-35" />
                <span className="absolute top-1 right-1.5 size-16 rotate-[10deg] rounded-[20px] bg-foret/14" />
                <span className="absolute top-[18px] left-[34px] flex size-14 items-center justify-center rounded-full border-2 border-encre bg-carte">
                  <Icone nom="recherche" taille={26} />
                </span>
              </div>
              <p className="font-titre text-xl leading-tight font-semibold">Aucune idée ne correspond</p>
              <p className="max-w-[300px] text-[14.5px] leading-[1.45] text-gris">
                {categorie || quartier
                  ? `Rien${categorie ? ` pour « ${categorie.nom} »` : ""}${quartier ? ` à ${quartier.nom}` : ""} pour l'instant. `
                  : "Aucun résultat pour cette recherche. "}
                Retirez un filtre, ou lancez la première idée ici.
              </p>
              <div className="mt-1.5 flex w-full flex-col gap-2 sm:w-auto">
                <Link href="/#fil" className="bouton-plein h-12 text-[15px]">
                  Élargir la recherche
                </Link>
                <Link
                  href="/idees/nouvelle"
                  className="flex min-h-11 items-center justify-center text-[14.5px] font-bold text-foret-fonce hover:underline"
                >
                  Proposer une idée{quartier ? ` à ${quartier.nom}` : ""}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-1">
              {suggestions.map((idee) => (
                <IdeeCard
                  key={idee.id}
                  idee={idee}
                  monVote={mesVotes[idee.id] ?? 0}
                  connecte={Boolean(utilisateur)}
                  estFavori={mesFavoris.has(idee.id)}
                />
              ))}
            </div>
          )}

          {pages > 1 && <Pagination filtres={filtres} pages={pages} total={total} affichees={suggestions.length} />}
        </div>
      </div>
    </section>
  );
}

function Pagination({
  filtres,
  pages,
  total,
  affichees,
}: {
  filtres: FiltresActifs;
  pages: number;
  total: number;
  affichees: number;
}) {
  function lien(page: number) {
    const params = new URLSearchParams();
    for (const cle of ["q", "quartier", "categorie", "tag"] as const) {
      if (filtres[cle]) params.set(cle, filtres[cle]);
    }
    if (filtres.tri !== "recentes") params.set("tri", filtres.tri);
    if (page > 1) params.set("page", String(page));
    const requete = params.toString();
    return `/${requete ? `?${requete}` : ""}#fil`;
  }

  return (
    <nav className="mt-5 flex flex-col items-center gap-2" aria-label="Pagination">
      <div className="flex items-center gap-2">
        {filtres.page > 1 && (
          <Link href={lien(filtres.page - 1)} className="bouton-contour h-12 text-[15px]">
            <Icone nom="gauche" taille={18} />
            Précédentes
          </Link>
        )}
        {filtres.page < pages && (
          <Link href={lien(filtres.page + 1)} className="bouton-contour h-12 text-[15px]">
            Voir plus d&apos;idées
            <Icone nom="droite" taille={18} />
          </Link>
        )}
      </div>
      <span className="text-[13px] text-gris">
        Page {filtres.page} sur {pages} · {affichees} idée{affichees > 1 ? "s" : ""} affichée{affichees > 1 ? "s" : ""} sur{" "}
        {total}
      </span>
    </nav>
  );
}

function SqueletteFil() {
  return (
    <div aria-busy="true" aria-label="Chargement des idées" className="flex flex-col gap-3.5 pt-8">
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-trait bg-carte">
          <div className="h-[150px] bg-sable" />
          <div className="flex flex-col gap-2.5 p-4">
            <div className="flex gap-2">
              <span className="h-5 w-24 rounded-full bg-sable" />
              <span className="h-5 w-[70px] rounded-full bg-sable-clair" />
            </div>
            <span className="h-[18px] w-[92%] rounded-md bg-sable" />
            <span className="h-[18px] w-3/5 rounded-md bg-sable" />
            <span className="mt-1.5 h-1.5 rounded-full bg-sable-clair" />
          </div>
        </div>
      ))}
    </div>
  );
}
