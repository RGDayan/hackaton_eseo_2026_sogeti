import "server-only";
import { notFound, redirect } from "next/navigation";
import { getUtilisateur, type Utilisateur } from "@/lib/session";

/** Un super-admin modère toutes les villes ; un modérateur, seulement les siennes. */
export function peutModerer(user: Utilisateur | null, villeSlug: string) {
  return Boolean(user && (user.estSuperAdmin || user.villesModerees.includes(villeSlug)));
}

export function estModerateur(user: Utilisateur | null) {
  return Boolean(user && (user.estSuperAdmin || user.villesModerees.length > 0));
}

/** Pour les pages : renvoie vers la connexion si besoin, sinon 404 (on ne révèle pas l'existence de la page). */
export async function exigerModerateur(villeSlug: string, retour: string) {
  const user = await getUtilisateur();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(retour)}`);
  if (!peutModerer(user, villeSlug)) notFound();
  return user;
}

export async function exigerSuperAdmin(retour: string) {
  const user = await getUtilisateur();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(retour)}`);
  if (!user.estSuperAdmin) notFound();
  return user;
}

/** Groupes Keycloak `/villes/<slug>/moderateurs` → slugs des villes modérées. */
export function villesDepuisGroupes(groupes: unknown): string[] {
  if (!Array.isArray(groupes)) return [];
  const slugs = groupes
    .map((g) => (typeof g === "string" ? /^\/villes\/([a-z0-9-]+)\/moderateurs$/.exec(g)?.[1] : undefined))
    .filter((s): s is string => Boolean(s));
  return [...new Set(slugs)];
}
