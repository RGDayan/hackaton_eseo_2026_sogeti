import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { HEX } from "@/lib/contraste";

// Données publiques (nom et couleurs) lues par le thème Keycloak, servi depuis une autre origine.
const ENTETES = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
};

/** GET /api/villes/<slug>/theme : charte graphique d'une ville, pour les pages de connexion Keycloak. */
export async function GET(_requete: Request, contexte: RouteContext<"/api/villes/[slug]/theme">) {
  await connection();
  const { slug } = await contexte.params;
  const ville = /^[a-z0-9-]{1,60}$/.test(slug)
    ? await prisma.ville.findUnique({
        where: { slug },
        select: { nom: true, couleurPrincipale: true, couleurPrincipaleFoncee: true, couleurAccent: true },
      })
    : null;
  if (!ville) return Response.json({ erreur: "Ville inconnue" }, { status: 404, headers: ENTETES });

  const couleurs = [ville.couleurPrincipale, ville.couleurPrincipaleFoncee, ville.couleurAccent];
  if (!couleurs.every((c) => HEX.test(c))) {
    return Response.json({ erreur: "Charte invalide" }, { status: 500, headers: ENTETES });
  }
  return Response.json(ville, { headers: ENTETES });
}
