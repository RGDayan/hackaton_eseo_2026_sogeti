import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FormulaireSuggestion } from "@/components/formulaire-suggestion";
import { getReferentiels } from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";
import { getVilleCourante } from "@/lib/ville";

export default function PageNouvelleIdee() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="font-titre text-3xl font-semibold text-foret sm:text-4xl">Proposer une idée</h1>
      <p className="mt-2 text-gris">Vos voisins pourront la découvrir et voter dès sa publication.</p>
      <Suspense fallback={<p className="mt-1 h-5" />}>
        <VilleConcernee />
      </Suspense>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-trait/50" />}>
        <Formulaire />
      </Suspense>
    </div>
  );
}

async function Formulaire() {
  const utilisateur = await getUtilisateur();
  if (!utilisateur) redirect("/connexion?next=/idees/nouvelle");

  const ville = await getVilleCourante();
  const { categories, localisations, tags } = await getReferentiels(ville.id);
  return (
    <FormulaireSuggestion
      // Le brouillon ne doit réapparaître ni pour un autre habitant, ni dans une autre ville.
      key={`${utilisateur.id}-${ville.id}`}
      categories={categories}
      quartiers={localisations}
      centreVille={{ latitude: ville.latitude, longitude: ville.longitude }}
      tagsExistants={tags.map((t) => t.nom)}
    />
  );
}

async function VilleConcernee() {
  const ville = await getVilleCourante();
  return (
    <p className="mt-1 text-sm text-gris">
      Ville : <strong className="text-encre">{ville.nom}</strong>. Pour une autre ville, changez-la dans
      l&apos;en-tête.
    </p>
  );
}
