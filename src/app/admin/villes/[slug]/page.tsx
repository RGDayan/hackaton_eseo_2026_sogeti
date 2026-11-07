import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  creerCategorie,
  creerQuartier,
  modifierCategorie,
  modifierQuartier,
  modifierVille,
  supprimerQuartier,
} from "@/app/admin/actions";
import { ChampsCategorie, ChampsQuartier, ChampsVille } from "@/app/admin/champs";
import { FormulaireAdmin } from "@/components/formulaire-admin";
import { prisma } from "@/lib/db";
import { exigerModerateur } from "@/lib/droits";

export default function PageAdminVille({ params, searchParams }: PageProps<"/admin/villes/[slug]">) {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <Link href="/admin" className="text-sm text-gris hover:text-encre hover:underline">
        ← Administration
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-trait/50" />}>
        <Contenu params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type PropsContenu = Pick<PageProps<"/admin/villes/[slug]">, "params" | "searchParams">;

async function Contenu({ params, searchParams }: PropsContenu) {
  await connection();
  const { slug } = await params;
  const user = await exigerModerateur(slug, `/admin/villes/${slug}`);
  const message = await searchParams;

  const [ville, categories] = await Promise.all([
    prisma.ville.findUnique({
      where: { slug },
      include: {
        localisations: {
          orderBy: { nom: "asc" },
          include: {
            categories: { select: { id: true } },
            _count: { select: { suggestions: true } },
          },
        },
      },
    }),
    prisma.categorie.findMany({ orderBy: { nom: "asc" } }),
  ]);
  if (!ville) notFound();

  const groupeKeycloak = `/villes/${ville.slug}/moderateurs`;

  return (
    <>
      <h1 className="mt-4 font-titre text-3xl font-semibold text-foret sm:text-4xl">{ville.nom}</h1>

      {(message.creee || message.slug) && (
        <p role="status" className="mt-4 rounded-xl bg-soleil/20 px-4 py-3 text-sm">
          {message.creee ? "Ville créée. " : "Identifiant d'URL modifié. "}
          Dans la console Keycloak, {message.creee ? "créez" : "renommez"} le groupe{" "}
          <code className="font-semibold">{groupeKeycloak}</code> et ajoutez-y les modérateurs de la ville.
        </p>
      )}

      {user.estSuperAdmin && (
        <section aria-labelledby="titre-ville" className="mt-8 rounded-2xl border border-trait bg-carte p-5">
          <h2 id="titre-ville" className="font-titre text-xl font-semibold">
            Paramètres de la ville
          </h2>
          <p className="mt-1 text-sm text-gris">
            Modérateurs : membres du groupe Keycloak <code>{groupeKeycloak}</code>.
          </p>
          <FormulaireAdmin action={modifierVille} bouton="Enregistrer la ville" className="mt-4">
            <input type="hidden" name="villeId" value={ville.id} />
            <ChampsVille prefixe="ville" ville={ville} />
          </FormulaireAdmin>
        </section>
      )}

      <section aria-labelledby="titre-quartiers" className="mt-10">
        <h2 id="titre-quartiers" className="font-titre text-xl font-semibold">
          Quartiers et communes
        </h2>
        <p className="mt-1 text-sm text-gris">
          Cochez les catégories proposées dans chaque quartier : le formulaire d&apos;idée ne propose que celles-ci.
        </p>

        <ul className="mt-4 space-y-3">
          {ville.localisations.map((q) => {
            const liees = new Set(q.categories.map((c) => c.id));
            return (
              <li key={q.id} className="rounded-2xl border border-trait bg-carte">
                <details>
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                    <span className="font-semibold">{q.nom}</span>
                    <span className="text-sm text-gris">
                      {q._count.suggestions} idée{q._count.suggestions > 1 ? "s" : ""} · {liees.size} catégorie
                      {liees.size > 1 ? "s" : ""}
                    </span>
                  </summary>
                  <div className="border-t border-trait p-4">
                    <FormulaireAdmin action={modifierQuartier} bouton="Enregistrer le quartier">
                      <input type="hidden" name="villeId" value={ville.id} />
                      <input type="hidden" name="quartierId" value={q.id} />
                      <ChampsQuartier prefixe={`quartier-${q.id}`} quartier={q} />
                      <fieldset className="mt-4">
                        <legend className="libelle">Catégories proposées</legend>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {categories.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name="categories" value={c.id} defaultChecked={liees.has(c.id)} />
                              {c.nom}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </FormulaireAdmin>

                    {q._count.suggestions === 0 ? (
                      <FormulaireAdmin
                        action={supprimerQuartier}
                        bouton="Supprimer ce quartier"
                        variante="danger"
                        className="mt-4 border-t border-trait pt-2"
                      >
                        <input type="hidden" name="villeId" value={ville.id} />
                        <input type="hidden" name="quartierId" value={q.id} />
                      </FormulaireAdmin>
                    ) : (
                      <p className="mt-4 border-t border-trait pt-3 text-sm text-gris">
                        Ce quartier contient des idées : il ne peut pas être supprimé.
                      </p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl border border-dashed border-trait p-5">
          <h3 className="font-semibold">Ajouter un quartier ou une commune</h3>
          <FormulaireAdmin action={creerQuartier} bouton="Ajouter" className="mt-3">
            <input type="hidden" name="villeId" value={ville.id} />
            <ChampsQuartier prefixe="nouveau-quartier" />
          </FormulaireAdmin>
        </div>
      </section>

      <section aria-labelledby="titre-categories" className="mt-10">
        <h2 id="titre-categories" className="font-titre text-xl font-semibold">
          Catégories
        </h2>
        <p className="mt-1 text-sm text-gris">
          Les catégories sont partagées entre les villes.{" "}
          {user.estSuperAdmin
            ? "Une modification s'applique partout."
            : "Seul le super-admin peut les renommer ou changer leur couleur."}
        </p>

        {user.estSuperAdmin && (
          <ul className="mt-4 space-y-3">
            {categories.map((c) => (
              <li key={c.id} className="rounded-2xl border border-trait bg-carte p-4">
                <FormulaireAdmin action={modifierCategorie} bouton="Enregistrer" variante="contour">
                  <input type="hidden" name="categorieId" value={c.id} />
                  <ChampsCategorie prefixe={`categorie-${c.id}`} categorie={c} />
                </FormulaireAdmin>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-2xl border border-dashed border-trait p-5">
          <h3 className="font-semibold">Nouvelle catégorie</h3>
          <FormulaireAdmin action={creerCategorie} bouton="Créer la catégorie" className="mt-3">
            <ChampsCategorie prefixe="nouvelle-categorie" />
          </FormulaireAdmin>
        </div>
      </section>
    </>
  );
}
