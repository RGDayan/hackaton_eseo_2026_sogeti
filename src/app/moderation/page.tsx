import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { retablirSuggestion } from "@/app/actions";
import { dateFr } from "@/components/idee-card";
import { prisma } from "@/lib/db";
import { estModerateur } from "@/lib/droits";
import { getUtilisateur } from "@/lib/session";

export default function PageModeration() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="font-titre text-3xl font-semibold text-foret sm:text-4xl">Modération</h1>
      <p className="mt-2 text-gris">Idées masquées dans les villes que vous modérez.</p>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-trait/50" />}>
        <ListeMasquees />
      </Suspense>
    </div>
  );
}

async function ListeMasquees() {
  await connection();
  const user = await getUtilisateur();
  if (!user) redirect("/connexion?next=/moderation");
  if (!estModerateur(user)) notFound();

  const idees = await prisma.suggestion.findMany({
    where: {
      masquee: true,
      ...(!user.estSuperAdmin && { localisation: { ville: { slug: { in: user.villesModerees } } } }),
    },
    orderBy: { masqueeLe: "desc" },
    take: 100,
    select: {
      id: true,
      titre: true,
      motifMasquage: true,
      masqueeLe: true,
      localisation: { select: { nom: true, ville: { select: { nom: true } } } },
    },
  });

  if (idees.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-trait p-8 text-center text-gris">
        Aucune idée masquée pour le moment.
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-trait rounded-2xl border border-trait bg-carte">
      {idees.map((idee) => (
        <li key={idee.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <Link href={`/idees/${idee.id}`} className="font-semibold hover:text-foret hover:underline">
              {idee.titre}
            </Link>
            <p className="text-sm text-gris">
              {idee.localisation.nom}, {idee.localisation.ville.nom}
              {idee.masqueeLe && <> · masquée le {dateFr(idee.masqueeLe)}</>}
              {idee.motifMasquage && <> · « {idee.motifMasquage} »</>}
            </p>
          </div>
          <form action={retablirSuggestion}>
            <input type="hidden" name="id" value={idee.id} />
            <button type="submit" className="bouton-contour">
              Rétablir
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
