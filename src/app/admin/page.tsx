import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { creerVille } from "@/app/admin/actions";
import { ChampsVille } from "@/app/admin/champs";
import { FormulaireAdmin } from "@/components/formulaire-admin";
import { prisma } from "@/lib/db";
import { estModerateur } from "@/lib/droits";
import { getUtilisateur } from "@/lib/session";

export default function PageAdmin() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="font-titre text-3xl font-semibold text-foret sm:text-4xl">Administration</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-trait/50" />}>
        <Contenu />
      </Suspense>
    </div>
  );
}

async function Contenu() {
  await connection();
  const user = await getUtilisateur();
  if (!user) redirect("/connexion?next=/admin");
  if (!estModerateur(user)) notFound();

  // Super-admin : toutes les villes. Modérateur : les siennes.
  const villes = await prisma.ville.findMany({
    where: user.estSuperAdmin ? {} : { slug: { in: user.villesModerees } },
    orderBy: { nom: "asc" },
    select: {
      slug: true,
      nom: true,
      couleurPrincipale: true,
      _count: { select: { localisations: true } },
    },
  });

  return (
    <>
      <p className="mt-2 text-gris">
        {user.estSuperAdmin
          ? "Vous gérez toutes les villes de la plateforme."
          : "Vous gérez les quartiers et les catégories des villes que vous modérez."}
      </p>

      <section aria-labelledby="titre-villes" className="mt-8">
        <h2 id="titre-villes" className="font-titre text-xl font-semibold">
          Villes
        </h2>
        <ul className="mt-3 divide-y divide-trait rounded-2xl border border-trait bg-carte">
          {villes.map((v) => (
            <li key={v.slug} className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3">
                <span aria-hidden className="h-4 w-4 rounded-full" style={{ backgroundColor: v.couleurPrincipale }} />
                <Link href={`/admin/villes/${v.slug}`} className="font-semibold hover:text-foret hover:underline">
                  {v.nom}
                </Link>
              </span>
              <span className="text-sm text-gris">
                {v._count.localisations} quartier{v._count.localisations > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {user.estSuperAdmin && (
        <section aria-labelledby="titre-nouvelle" className="mt-10 rounded-2xl border border-trait bg-carte p-5">
          <h2 id="titre-nouvelle" className="font-titre text-xl font-semibold">
            Ajouter une ville
          </h2>
          <FormulaireAdmin action={creerVille} bouton="Créer la ville" className="mt-4">
            <ChampsVille prefixe="nouvelle-ville" />
          </FormulaireAdmin>
        </section>
      )}
    </>
  );
}
