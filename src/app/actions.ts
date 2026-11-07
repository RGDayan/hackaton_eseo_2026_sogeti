"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getUtilisateur, ouvrirSession, type Droits } from "@/lib/session";
import { peutModerer } from "@/lib/droits";
import { enregistrerFichiers, preparerFichiers, supprimerFichiers, supprimerFichiersParNom } from "@/lib/uploads";
import { COOKIE_VILLE, getVilleCourante } from "@/lib/ville";
import { cheminSur, schemaMotif, schemaSuggestion, type EtatSuggestion } from "@/lib/validation";

/** Comptes fictifs du mode démo : connexion directe, sans Keycloak (filet de sécurité pour l'oral). */
const PROFILS_DEMO = {
  habitant: { nickname: "Habitant (démo)", droits: { superAdmin: false, villesModerees: [] } },
  "moderateur-dijon": { nickname: "Modo Dijon (démo)", droits: { superAdmin: false, villesModerees: ["dijon"] } },
  "moderateur-besancon": {
    nickname: "Modo Besançon (démo)",
    droits: { superAdmin: false, villesModerees: ["besancon"] },
  },
  "super-admin": { nickname: "Admin (démo)", droits: { superAdmin: true, villesModerees: [] } },
} satisfies Record<string, { nickname: string; droits: Droits }>;

export type ProfilDemo = keyof typeof PROFILS_DEMO;

export async function connexionDemo(formData: FormData) {
  if (process.env.MODE_DEMO !== "true") redirect("/connexion");

  const cle = String(formData.get("profil"));
  if (!Object.hasOwn(PROFILS_DEMO, cle)) redirect("/connexion");
  const { nickname, droits } = PROFILS_DEMO[cle as ProfilDemo];

  const nicknameKey = nickname.toLowerCase();
  const user = await prisma.user.upsert({
    where: { nicknameKey },
    update: {},
    create: { nickname, nicknameKey },
    select: { id: true },
  });

  await ouvrirSession(user.id, droits);
  revalidatePath("/", "layout");
  redirect(cheminSur(formData.get("next")));
}

/** Sélecteur de ville de l'en-tête : mémorise le choix dans un cookie, puis revient à l'accueil. */
export async function choisirVille(formData: FormData) {
  const slug = String(formData.get("ville") ?? "").slice(0, 60);
  const ville = await prisma.ville.findUnique({ where: { slug }, select: { slug: true } });
  if (ville) {
    (await cookies()).set(COOKIE_VILLE, ville.slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  revalidatePath("/", "layout");
  // Retour à l'accueil sans filtres : un quartier de l'ancienne ville n'aurait plus de sens.
  redirect("/");
}

export type ResultatVote = { statut: "ok" | "non-connecte" | "erreur" };

/** Voter deux fois de la même façon retire le vote ; voter à l'inverse le remplace. */
export async function voter(suggestionId: number, valeur: 1 | -1): Promise<ResultatVote> {
  if (!Number.isInteger(suggestionId) || (valeur !== 1 && valeur !== -1)) return { statut: "erreur" };

  const user = await getUtilisateur();
  if (!user) return { statut: "non-connecte" };

  const cle = { userId_suggestionId: { userId: user.id, suggestionId } };
  try {
    await prisma.$transaction(async (tx) => {
      const existant = await tx.vote.findUnique({ where: cle });
      let pour = 0;
      let contre = 0;

      if (existant?.valeur === valeur) {
        await tx.vote.delete({ where: cle });
        if (valeur === 1) pour = -1;
        else contre = -1;
      } else if (existant) {
        await tx.vote.update({ where: cle, data: { valeur } });
        pour = valeur;
        contre = -valeur;
      } else {
        await tx.vote.create({ data: { userId: user.id, suggestionId, valeur } });
        if (valeur === 1) pour = 1;
        else contre = 1;
      }

      await tx.suggestion.update({
        where: { id: suggestionId },
        data: {
          votesPour: { increment: pour },
          votesContre: { increment: contre },
          score: { increment: pour - contre },
        },
      });
    });
  } catch (e) {
    // Double clic concurrent ou idée disparue : la transaction est annulée, les compteurs restent justes.
    if (e instanceof Prisma.PrismaClientKnownRequestError) return { statut: "erreur" };
    throw e;
  }

  revalidatePath("/", "layout");
  return { statut: "ok" };
}

function lireTags(formData: FormData) {
  const tags = formData.getAll("tags").map((t) => String(t).trim().toLowerCase());
  return [...new Set(tags.filter(Boolean))];
}

export async function creerSuggestion(formData: FormData): Promise<EtatSuggestion> {
  const user = await getUtilisateur();
  if (!user) redirect("/connexion?next=/idees/nouvelle");

  const resultat = schemaSuggestion.safeParse({
    titre: formData.get("titre"),
    description: formData.get("description"),
    categorieId: formData.get("categorieId"),
    localisationId: formData.get("localisationId"),
    tags: lireTags(formData),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });

  const fichiers = await preparerFichiers(formData.getAll("fichiers").filter((f) => f instanceof File));

  if (!resultat.success || typeof fichiers === "string") {
    const erreurs: NonNullable<EtatSuggestion["erreurs"]> = {};
    for (const issue of resultat.error?.issues ?? []) {
      const champ = issue.path[0] as keyof typeof erreurs;
      erreurs[champ] ??= issue.message;
    }
    if (typeof fichiers === "string") erreurs.fichiers = fichiers;
    return { erreurs };
  }

  const { tags, ...donnees } = resultat.data;

  // Le quartier doit appartenir à la ville courante, et la catégorie être proposée dans ce quartier.
  const ville = await getVilleCourante();
  const quartier = await prisma.localisation.findFirst({
    where: { id: donnees.localisationId, villeId: ville.id },
    select: { categories: { where: { id: donnees.categorieId }, select: { id: true } } },
  });
  if (!quartier) return { erreurs: { localisationId: `Choisissez un quartier de ${ville.nom}.` } };
  if (quartier.categories.length === 0) {
    return { erreurs: { categorieId: "Cette catégorie n'est pas proposée dans ce quartier." } };
  }

  try {
    await enregistrerFichiers(fichiers);
    const suggestion = await prisma.suggestion.create({
      data: {
        ...donnees,
        auteurId: user.id,
        tags: {
          connectOrCreate: tags.map((nom) => ({ where: { nom }, create: { nom } })),
        },
        piecesJointes: {
          create: fichiers.map(({ nomOriginal, nomStockage, typeMime, taille }) => ({
            nomOriginal,
            nomStockage,
            typeMime,
            taille,
          })),
        },
      },
      select: { id: true },
    });
    revalidatePath("/", "layout");
    return { id: suggestion.id };
  } catch (e) {
    await supprimerFichiers(fichiers);
    console.error("Création de suggestion impossible", e);
    return { erreur: "Votre idée n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
}

// ——— Modération : modérateur de la ville de l'idée, ou super-admin. Droits revérifiés côté serveur. ———

async function ideeModerable(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return null;
  const [user, idee] = await Promise.all([
    getUtilisateur(),
    prisma.suggestion.findUnique({
      where: { id },
      select: {
        id: true,
        localisation: { select: { ville: { select: { slug: true } } } },
        piecesJointes: { select: { nomStockage: true } },
      },
    }),
  ]);
  if (!idee || !peutModerer(user, idee.localisation.ville.slug)) return null;
  return { idee, user: user! };
}

export type EtatModeration = { erreur?: string };

export async function masquerSuggestion(_etat: EtatModeration, formData: FormData): Promise<EtatModeration> {
  const contexte = await ideeModerable(formData);
  if (!contexte) return { erreur: "Action non autorisée." };

  const motif = schemaMotif.safeParse(formData.get("motif"));
  if (!motif.success) return { erreur: motif.error.issues[0].message };

  await prisma.suggestion.update({
    where: { id: contexte.idee.id },
    data: { masquee: true, motifMasquage: motif.data, masqueeLe: new Date(), masqueeParId: contexte.user.id },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function retablirSuggestion(formData: FormData) {
  const contexte = await ideeModerable(formData);
  if (!contexte) return;
  await prisma.suggestion.update({
    where: { id: contexte.idee.id },
    data: { masquee: false, motifMasquage: null, masqueeLe: null, masqueeParId: null },
  });
  revalidatePath("/", "layout");
}

export async function supprimerSuggestion(_etat: EtatModeration, formData: FormData): Promise<EtatModeration> {
  const contexte = await ideeModerable(formData);
  if (!contexte) return { erreur: "Action non autorisée." };
  if (formData.get("confirmation") !== "oui") return { erreur: "Cochez la case pour confirmer la suppression." };

  // Votes et métadonnées des pièces jointes partent en cascade ; les fichiers sont effacés ensuite.
  await prisma.suggestion.delete({ where: { id: contexte.idee.id } });
  await supprimerFichiersParNom(contexte.idee.piecesJointes.map((p) => p.nomStockage));
  revalidatePath("/", "layout");
  redirect("/");
}
