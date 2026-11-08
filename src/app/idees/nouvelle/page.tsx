import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireSuggestion } from "@/components/formulaire-suggestion";
import { Icone } from "@/components/icone";
import { getReferentiels } from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";
import { getVilleCourante } from "@/lib/ville";

export const metadata: Metadata = { title: "Proposer une idée · Quartea" };

export default function PageNouvelleIdee() {
  return (
    <div className="mx-auto max-w-2xl lg:pt-8">
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-sable/60" />}>
        <Contenu />
      </Suspense>
    </div>
  );
}

async function Contenu() {
  const utilisateur = await getUtilisateur();
  if (!utilisateur) return <Intermediaire />;

  const ville = await getVilleCourante();
  const { categories, localisations, tags } = await getReferentiels(ville.id);
  return (
    <FormulaireSuggestion
      // Formulaire remis à zéro pour un autre habitant ou une autre ville.
      key={`${utilisateur.id}-${ville.id}`}
      categories={categories}
      quartiers={localisations}
      centreVille={{ latitude: ville.latitude, longitude: ville.longitude }}
      tagsExistants={tags.map((t) => t.nom)}
      pseudo={utilisateur.nickname}
    />
  );
}

/** Visiteur sans compte : on explique pourquoi un compte est nécessaire, au lieu de le rediriger d'office. */
function Intermediaire() {
  const retour = encodeURIComponent("/idees/nouvelle");
  const avantages = [
    "Un pseudo et un mot de passe suffisent",
    "Pas d'e-mail obligatoire, aucune donnée personnelle",
    "Vous revenez ici juste après, prêt à écrire",
  ];

  return (
    <div className="flex flex-col gap-3.5 px-1 pt-7">
      <div aria-hidden className="relative mx-auto mb-1.5 h-[150px] w-[300px]">
        <span className="absolute top-2.5 left-24 size-[130px] rounded-full bg-soleil opacity-35" />
        <span className="absolute top-[46px] left-[60px] flex h-24 w-[88px] -rotate-[7deg] flex-col gap-[7px] rounded-[18px] border-2 border-encre bg-carte px-3 py-4">
          <span className="h-1.5 rounded-full bg-encre" />
          <span className="h-1.5 w-[70%] rounded-full bg-trait-fonce" />
          <span className="h-1.5 w-[85%] rounded-full bg-trait-fonce" />
        </span>
        <span className="absolute top-[30px] left-[170px] h-[72px] w-[54px] -rotate-45 rounded-[50%_50%_50%_0] border-[3px] border-papier bg-foret shadow-[0_6px_14px_rgb(0_0_0/0.18)]" />
        <span className="absolute top-[51px] left-[186px] text-white">
          <Icone nom="plus" taille={22} epaisseur={3} />
        </span>
        <span className="absolute top-6 left-[250px] text-foret-fonce">
          <Icone nom="etincelle" taille={26} />
        </span>
      </div>
      <h1 className="font-titre text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance lg:text-4xl">
        Pour proposer une idée, créez votre compte en 20 secondes
      </h1>
      <ul className="mt-1 flex flex-col gap-2.5 text-[15.5px]">
        {avantages.map((a) => (
          <li key={a} className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foret/12 text-foret-fonce">
              <Icone nom="valider" taille={15} epaisseur={3} />
            </span>
            {a}
          </li>
        ))}
      </ul>
      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <a href={`/auth/login?inscription=1&next=${retour}`} className="bouton-plein bouton-grand sm:px-8">
          Créer un compte
        </a>
        <Link href={`/connexion?next=${retour}`} className="bouton-contour bouton-grand sm:px-8">
          Se connecter
        </Link>
        <Link href="/" className="flex min-h-11 items-center justify-center text-[14.5px] font-semibold text-gris hover:text-encre sm:px-4">
          Continuer à explorer les idées
        </Link>
      </div>
    </div>
  );
}
