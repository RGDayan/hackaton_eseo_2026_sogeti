import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { urlConnexion } from "@/lib/oidc";
import { cheminSur } from "@/lib/validation";
import { getVilleCourante } from "@/lib/ville";

/** GET /auth/login?next=/chemin[&inscription=1] : redirige vers la page de connexion Keycloak. */
export async function GET(requete: NextRequest) {
  const parametres = requete.nextUrl.searchParams;
  const suivant = cheminSur(parametres.get("next"));

  let destination: URL;
  try {
    const ville = await getVilleCourante().catch(() => null);
    destination = await urlConnexion(suivant, parametres.get("inscription") === "1", ville?.slug);
  } catch (e) {
    console.error("Keycloak injoignable", e);
    redirect(`/connexion?erreur=indisponible&next=${encodeURIComponent(suivant)}`);
  }
  redirect(destination.href);
}
