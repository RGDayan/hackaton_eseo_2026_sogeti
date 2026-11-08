import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icone } from "@/components/icone";
import { IdeeLigne } from "@/components/idee-card";
import { estModerateur } from "@/lib/droits";
import { monogramme, pluriel } from "@/lib/format";
import { getActivite } from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";
import { getVilleCourante } from "@/lib/ville";

export const metadata: Metadata = { title: "Mon espace · Quartea" };

const ONGLETS = [
  { id: "idees", libelle: "Mes idées" },
  { id: "votes", libelle: "Mes votes" },
  { id: "favoris", libelle: "Mes favoris" },
] as const;

type Onglet = (typeof ONGLETS)[number]["id"];

const formatMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export default function PageMonEspace({ searchParams }: PageProps<"/moi">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-sable/60" />}>
        <MonEspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MonEspace({ searchParams }: { searchParams: PageProps<"/moi">["searchParams"] }) {
  const utilisateur = await getUtilisateur();
  if (!utilisateur) redirect("/connexion?next=/moi");

  const params = await searchParams;
  const onglet: Onglet = ONGLETS.some((o) => o.id === params.onglet) ? (params.onglet as Onglet) : "idees";
  const [activite, ville] = await Promise.all([getActivite(utilisateur.id), getVilleCourante()]);
  const nombres: Record<Onglet, number> = {
    idees: activite.idees.length,
    votes: activite.votes.length,
    favoris: activite.favoris.length,
  };

  return (
    <>
      <section className="flex flex-col gap-4 pt-[22px] pb-[18px] lg:pt-10">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex size-[68px] shrink-0 items-center justify-center rounded-full bg-soleil font-titre text-[32px] font-semibold text-encre ring-2 ring-foret ring-offset-[3px] ring-offset-papier"
          >
            {monogramme(utilisateur.nickname)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-titre text-[25px] leading-[1.1] font-semibold lg:text-4xl">{utilisateur.nickname}</h1>
            <p className="mt-1 text-sm text-gris">
              {ville.nom}
              {activite.inscritLe && ` · membre depuis ${formatMois.format(activite.inscritLe)}`}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          {[
            { n: nombres.idees, lib: nombres.idees > 1 ? "idées proposées" : "idée proposée" },
            { n: nombres.votes, lib: nombres.votes > 1 ? "votes" : "vote" },
            { n: activite.commentaires, lib: activite.commentaires > 1 ? "commentaires" : "commentaire" },
          ].map((c) => (
            <div key={c.lib} className="flex flex-col-reverse rounded-2xl border border-trait bg-carte px-3 py-2.5">
              <dt className="mt-1 text-[12.5px] text-gris">{c.lib}</dt>
              <dd className="font-titre text-2xl leading-none font-semibold">{c.n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="Mon activité" className="sticky top-16 z-10 -mx-4 border-b border-trait bg-papier px-3 sm:mx-0 sm:px-0">
        <ul className="flex gap-1">
          {ONGLETS.map((o) => {
            const actif = o.id === onglet;
            return (
              <li key={o.id} className="flex-1">
                <Link
                  href={`/moi?onglet=${o.id}`}
                  scroll={false}
                  aria-current={actif ? "page" : undefined}
                  className={`-mb-px flex h-12 items-center justify-center gap-1 border-b-[3px] text-[14.5px] whitespace-nowrap ${
                    actif ? "border-foret font-bold text-foret-fonce" : "border-transparent font-semibold hover:text-foret-fonce"
                  }`}
                >
                  {o.libelle} <span className="font-medium text-gris">{nombres[o.id]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="py-4" aria-label={ONGLETS.find((o) => o.id === onglet)!.libelle}>
        {onglet === "idees" &&
          (activite.idees.length === 0 ? (
            <Vide
              titre="Vous n'avez pas encore proposé d'idée"
              texte="Un banc, une piste, un jardin : ce qui manque à votre quartier commence souvent par une phrase."
              lien={{ href: "/idees/nouvelle", libelle: "Proposer ma première idée" }}
            />
          ) : (
            <Liste>
              {activite.idees.map((idee) => (
                <li key={idee.id}>
                  <IdeeLigne idee={idee} afficherVille />
                </li>
              ))}
            </Liste>
          ))}

        {onglet === "votes" &&
          (activite.votes.length === 0 ? (
            <Vide
              titre="Vous n'avez pas encore voté"
              texte="Soutenez les idées de vos voisins : chaque vote compte pour la ville."
              lien={{ href: "/#fil", libelle: "Parcourir les idées" }}
            />
          ) : (
            <Liste>
              {activite.votes.map((idee) => (
                <li key={idee.id}>
                  <IdeeLigne idee={idee} monVote={idee.monVote} afficherVille />
                </li>
              ))}
            </Liste>
          ))}

        {onglet === "favoris" &&
          (activite.favoris.length === 0 ? (
            <Vide
              titre="Aucun favori pour l'instant"
              texte="Touchez le cœur d'une idée pour la retrouver ici, quelle que soit sa ville."
              lien={{ href: "/#fil", libelle: "Parcourir les idées" }}
            />
          ) : (
            <>
              <p className="mb-2.5 text-[13.5px] text-gris">
                {pluriel(activite.favoris.length, "idée")}, toutes villes confondues
              </p>
              <Liste>
                {activite.favoris.map((idee) => (
                  <li key={idee.id}>
                    <IdeeLigne idee={idee} afficherVille />
                  </li>
                ))}
              </Liste>
            </>
          ))}
      </section>

      <div className="flex flex-col gap-1 border-t border-trait pt-3.5">
        {estModerateur(utilisateur) && (
          <>
            <Link href="/moderation" className="flex min-h-12 items-center gap-2.5 text-[15px] font-semibold hover:text-foret-fonce">
              <Icone nom="bouclier" taille={19} />
              Modération
            </Link>
            <Link href="/admin" className="flex min-h-12 items-center gap-2.5 text-[15px] font-semibold hover:text-foret-fonce">
              <Icone nom="reglages" taille={19} />
              Administration
            </Link>
          </>
        )}
        <Link href="/villes" className="flex min-h-12 items-center gap-2.5 text-[15px] font-semibold hover:text-foret-fonce">
          <Icone nom="changer" taille={19} />
          Changer de ville
        </Link>
        {/* Route Handler : ferme aussi la session Keycloak. */}
        <form action="/auth/logout" method="post">
          <button type="submit" className="flex min-h-12 items-center gap-2.5 text-[15px] font-semibold text-tomate-fonce hover:underline">
            <Icone nom="deconnexion" taille={19} />
            Se déconnecter
          </button>
        </form>
      </div>
    </>
  );
}

function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-2.5 md:grid-cols-2 md:gap-3">{children}</ul>;
}

function Vide({ titre, texte, lien }: { titre: string; texte: string; lien: { href: string; libelle: string } }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-2.5 py-[22px] text-center">
      <div aria-hidden className="relative h-[100px] w-[130px]">
        <span className="absolute top-2 left-5 size-[84px] rounded-full bg-soleil opacity-35" />
        <span className="absolute top-[22px] left-9 flex h-[70px] w-[62px] -rotate-6 items-center justify-center rounded-[14px] border-2 border-encre bg-carte text-foret-fonce">
          <Icone nom="crayon" taille={26} />
        </span>
      </div>
      <p className="font-titre text-[21px] leading-tight font-semibold">{titre}</p>
      <p className="max-w-[290px] text-[14.5px] leading-[1.45] text-gris">{texte}</p>
      <Link href={lien.href} className="bouton-plein mt-1.5 h-[50px] px-6 text-[15px]">
        <Icone nom="plus" taille={18} epaisseur={2.6} />
        {lien.libelle}
      </Link>
    </div>
  );
}
