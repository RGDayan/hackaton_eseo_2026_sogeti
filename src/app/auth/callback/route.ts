import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { villesDepuisGroupes } from "@/lib/droits";
import { traiterCallback, type IdentiteKeycloak } from "@/lib/oidc";
import { ouvrirSession } from "@/lib/session";

/** Retour de Keycloak : échange du code, création ou mise à jour du compte, ouverture de la session. */
export async function GET(requete: NextRequest) {
  const parametres = requete.nextUrl.searchParams;
  // Annulation sur la page Keycloak, ou erreur renvoyée par Keycloak.
  if (parametres.has("error")) redirect("/connexion?erreur=annulee");

  let identite: IdentiteKeycloak;
  try {
    identite = await traiterCallback(parametres);
  } catch (e) {
    console.error("Échec du retour Keycloak", e);
    redirect("/connexion?erreur=echec");
  }

  const user = await trouverOuCreer(identite.sub, identite.pseudo);
  await ouvrirSession(
    user.id,
    {
      superAdmin: identite.roles.includes("super-admin"),
      villesModerees: villesDepuisGroupes(identite.groupes),
    },
    identite.idToken,
  );
  revalidatePath("/", "layout");
  redirect(identite.suivant);
}

/** Le pseudo public est le nom d'utilisateur Keycloak, rendu unique (sans tenir compte de la casse). */
async function trouverOuCreer(keycloakId: string, pseudo: string) {
  const existant = await prisma.user.findUnique({ where: { keycloakId }, select: { id: true } });
  if (existant) return existant;

  const base = pseudo.replace(/[^\p{L}\p{N} _.-]/gu, "-").slice(0, 24) || "habitant";
  for (let essai = 1; essai < 50; essai++) {
    const suffixe = essai === 1 ? "" : `-${essai}`;
    const nickname = base.slice(0, 24 - suffixe.length) + suffixe;
    const nicknameKey = nickname.toLowerCase();
    if (await prisma.user.findUnique({ where: { nicknameKey }, select: { id: true } })) continue;
    return prisma.user.create({ data: { nickname, nicknameKey, keycloakId }, select: { id: true } });
  }
  throw new Error("Impossible d'attribuer un pseudo unique.");
}
