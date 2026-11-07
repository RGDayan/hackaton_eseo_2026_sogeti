import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IdeeCard } from "@/components/idee-card";
import { getMesVotes, listerFavoris } from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";

export const metadata: Metadata = { title: "Mes favoris · Place Commune" };

export default function PageFavoris() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <Link href="/" className="text-sm text-gris hover:text-encre hover:underline">
        ← Toutes les idées
      </Link>
      <h1 className="mt-4 font-titre text-3xl font-semibold text-foret sm:text-4xl">Mes favoris</h1>
      <Suspense fallback={<div className="mt-6 h-52 animate-pulse rounded-2xl bg-trait/50" />}>
        <Favoris />
      </Suspense>
    </div>
  );
}

async function Favoris() {
  const utilisateur = await getUtilisateur();
  if (!utilisateur) redirect("/connexion?next=/favoris");

  const idees = await listerFavoris(utilisateur.id);
  const mesVotes = await getMesVotes(
    utilisateur.id,
    idees.map((i) => i.id),
  );

  if (idees.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-trait p-10 text-center">
        <p className="font-titre text-xl font-semibold">Aucun favori pour l&apos;instant.</p>
        <p className="mt-2 text-sm text-gris">
          Utilisez le bouton « Ajouter » d&apos;une idée pour la retrouver ici.
        </p>
        <Link href="/" className="bouton-plein mt-4">
          Parcourir les idées
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 mb-4 text-sm text-gris">
        {idees.length} idée{idees.length > 1 ? "s" : ""} en favori
      </p>
      <div className="space-y-4">
        {idees.map((idee) => (
          <IdeeCard key={idee.id} idee={idee} monVote={mesVotes[idee.id] ?? 0} connecte estFavori />
        ))}
      </div>
    </>
  );
}
