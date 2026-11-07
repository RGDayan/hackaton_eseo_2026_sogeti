"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { estModerateur, peutModerer } from "@/lib/droits";
import { getUtilisateur } from "@/lib/session";
import {
  schemaCategorie,
  schemaQuartier,
  schemaVille,
  slugifier,
  type EtatAdmin,
} from "@/lib/validation";

// Toutes les actions revérifient les droits côté serveur : masquer un formulaire ne suffit pas.

const REFUS: EtatAdmin = { erreur: "Action non autorisée." };

function champs(formData: FormData, noms: string[]) {
  return Object.fromEntries(noms.map((n) => [n, formData.get(n) ?? ""]));
}

/** Slug saisi, sinon déduit du nom. */
function avecSlug(donnees: Record<string, FormDataEntryValue>) {
  const slug = String(donnees.slug ?? "").trim();
  return { ...donnees, slug: slug || slugifier(String(donnees.nom ?? "")) };
}

function premiereErreur(erreur: { issues: { message: string }[] }): EtatAdmin {
  return { erreur: erreur.issues[0]?.message ?? "Saisie invalide." };
}

function doublon(e: unknown): EtatAdmin | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { erreur: "Ce nom ou cet identifiant d'URL est déjà utilisé." };
  }
  return null;
}

function rafraichir() {
  revalidatePath("/", "layout");
}

/** Ville désignée par le formulaire, si l'utilisateur peut l'administrer (modérateur de la ville ou super-admin). */
async function villeAdministrable(formData: FormData) {
  const villeId = Number(formData.get("villeId"));
  if (!Number.isInteger(villeId)) return null;
  const [user, ville] = await Promise.all([
    getUtilisateur(),
    prisma.ville.findUnique({ where: { id: villeId }, select: { id: true, slug: true } }),
  ]);
  return ville && peutModerer(user, ville.slug) ? ville : null;
}

// ——— Villes (super-admin) ———

const CHAMPS_VILLE = [
  "nom",
  "slug",
  "latitude",
  "longitude",
  "zoom",
  "couleurPrincipale",
  "couleurPrincipaleFoncee",
  "couleurAccent",
  "logoUrl",
];

export async function creerVille(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  if (!(await getUtilisateur())?.estSuperAdmin) return REFUS;
  const resultat = schemaVille.safeParse(avecSlug(champs(formData, CHAMPS_VILLE)));
  if (!resultat.success) return premiereErreur(resultat.error);

  try {
    await prisma.ville.create({ data: resultat.data });
  } catch (e) {
    return doublon(e) ?? { erreur: "La ville n'a pas pu être créée." };
  }
  rafraichir();
  redirect(`/admin/villes/${resultat.data.slug}?creee=1`);
}

export async function modifierVille(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  if (!(await getUtilisateur())?.estSuperAdmin) return REFUS;
  const id = Number(formData.get("villeId"));
  const resultat = schemaVille.safeParse(avecSlug(champs(formData, CHAMPS_VILLE)));
  if (!Number.isInteger(id)) return REFUS;
  if (!resultat.success) return premiereErreur(resultat.error);

  const ancienne = await prisma.ville.findUnique({ where: { id }, select: { slug: true } });
  if (!ancienne) return REFUS;
  try {
    await prisma.ville.update({ where: { id }, data: { ...resultat.data, logoUrl: resultat.data.logoUrl ?? null } });
  } catch (e) {
    return doublon(e) ?? { erreur: "La ville n'a pas pu être modifiée." };
  }
  rafraichir();
  // Le slug sert aussi aux groupes Keycloak des modérateurs : le changer impose de renommer le groupe.
  if (ancienne.slug !== resultat.data.slug) redirect(`/admin/villes/${resultat.data.slug}?slug=1`);
  return { ok: "Ville enregistrée." };
}

// ——— Quartiers (modérateur de la ville ou super-admin) ———

const CHAMPS_QUARTIER = ["nom", "slug", "latitude", "longitude"];

export async function creerQuartier(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  const ville = await villeAdministrable(formData);
  if (!ville) return REFUS;
  const resultat = schemaQuartier.safeParse(avecSlug(champs(formData, CHAMPS_QUARTIER)));
  if (!resultat.success) return premiereErreur(resultat.error);

  try {
    await prisma.localisation.create({ data: { ...resultat.data, villeId: ville.id } });
  } catch (e) {
    return doublon(e) ?? { erreur: "Le quartier n'a pas pu être créé." };
  }
  rafraichir();
  return { ok: `Quartier « ${resultat.data.nom} » ajouté.` };
}

export async function modifierQuartier(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  const ville = await villeAdministrable(formData);
  const id = Number(formData.get("quartierId"));
  if (!ville || !Number.isInteger(id)) return REFUS;
  const resultat = schemaQuartier.safeParse(avecSlug(champs(formData, CHAMPS_QUARTIER)));
  if (!resultat.success) return premiereErreur(resultat.error);

  // Catégories cochées : uniquement des catégories existantes.
  const categorieIds = formData
    .getAll("categories")
    .map(Number)
    .filter((n) => Number.isInteger(n));
  const existantes = await prisma.categorie.findMany({ where: { id: { in: categorieIds } }, select: { id: true } });

  try {
    const { count } = await prisma.localisation.updateMany({
      where: { id, villeId: ville.id },
      data: resultat.data,
    });
    if (count === 0) return REFUS;
    await prisma.localisation.update({
      where: { id },
      data: { categories: { set: existantes } },
    });
  } catch (e) {
    return doublon(e) ?? { erreur: "Le quartier n'a pas pu être modifié." };
  }
  rafraichir();
  return { ok: "Quartier enregistré." };
}

export async function supprimerQuartier(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  const ville = await villeAdministrable(formData);
  const id = Number(formData.get("quartierId"));
  if (!ville || !Number.isInteger(id)) return REFUS;

  const quartier = await prisma.localisation.findFirst({
    where: { id, villeId: ville.id },
    select: { _count: { select: { suggestions: true } } },
  });
  if (!quartier) return REFUS;
  if (quartier._count.suggestions > 0) {
    return { erreur: "Ce quartier contient des idées : il ne peut pas être supprimé." };
  }
  await prisma.localisation.delete({ where: { id } });
  rafraichir();
  return { ok: "Quartier supprimé." };
}

// ——— Catégories ———

const CHAMPS_CATEGORIE = ["nom", "slug", "couleur"];

/** Un modérateur peut créer une catégorie, puis la rattacher aux quartiers de sa ville. */
export async function creerCategorie(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  if (!estModerateur(await getUtilisateur())) return REFUS;
  const resultat = schemaCategorie.safeParse(avecSlug(champs(formData, CHAMPS_CATEGORIE)));
  if (!resultat.success) return premiereErreur(resultat.error);

  try {
    await prisma.categorie.create({ data: resultat.data });
  } catch (e) {
    return doublon(e) ?? { erreur: "La catégorie n'a pas pu être créée." };
  }
  rafraichir();
  return { ok: `Catégorie « ${resultat.data.nom} » créée : cochez-la dans les quartiers concernés.` };
}

/** Renommer ou recolorer une catégorie touche toutes les villes : réservé au super-admin. */
export async function modifierCategorie(_etat: EtatAdmin, formData: FormData): Promise<EtatAdmin> {
  if (!(await getUtilisateur())?.estSuperAdmin) return REFUS;
  const id = Number(formData.get("categorieId"));
  if (!Number.isInteger(id)) return REFUS;
  const resultat = schemaCategorie.safeParse(avecSlug(champs(formData, CHAMPS_CATEGORIE)));
  if (!resultat.success) return premiereErreur(resultat.error);

  try {
    await prisma.categorie.update({ where: { id }, data: resultat.data });
  } catch (e) {
    return doublon(e) ?? { erreur: "La catégorie n'a pas pu être modifiée." };
  }
  rafraichir();
  return { ok: "Catégorie enregistrée." };
}
