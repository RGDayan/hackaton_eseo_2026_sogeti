import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "@/lib/db";

/** Cookie qui mémorise la ville choisie dans le sélecteur de l'en-tête. */
export const COOKIE_VILLE = "pc_ville";

const champsVille = {
  id: true,
  nom: true,
  slug: true,
  latitude: true,
  longitude: true,
  zoom: true,
  couleurPrincipale: true,
  couleurPrincipaleFoncee: true,
  couleurAccent: true,
  logoUrl: true,
} as const;

export const listerVilles = cache(async () => {
  await connection();
  return prisma.ville.findMany({ orderBy: { nom: "asc" }, select: champsVille });
});

export type VilleCourante = Awaited<ReturnType<typeof listerVilles>>[number];

/**
 * Ville choisie par l'habitant : cookie, sinon `VILLE_PAR_DEFAUT`, sinon la première ville.
 * Mémorisée le temps de la requête.
 */
export const getVilleCourante = cache(async (): Promise<VilleCourante> => {
  const villes = await listerVilles();
  if (villes.length === 0) {
    throw new Error("Aucune ville en base : lancez `npm run db:seed`.");
  }
  const parDefaut = process.env.VILLE_PAR_DEFAUT;
  const choisie = (await cookies()).get(COOKIE_VILLE)?.value;
  return (
    villes.find((v) => v.slug === choisie) ?? villes.find((v) => v.slug === parDefaut) ?? villes[0]
  );
});
