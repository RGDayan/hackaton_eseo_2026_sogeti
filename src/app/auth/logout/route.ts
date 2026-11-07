import { revalidatePath } from "next/cache";
import { urlApplication, urlDeconnexion } from "@/lib/oidc";
import { fermerSession } from "@/lib/session";

/** POST /auth/logout : ferme la session de l'application, puis celle de Keycloak si elle existe. */
export async function POST() {
  const idToken = await fermerSession();
  revalidatePath("/", "layout");

  // Compte du mode démo : pas de session Keycloak à fermer.
  const destination = idToken ? await urlDeconnexion(idToken) : null;

  // 303 : le navigateur suit la redirection en GET (une 307 rejouerait le POST).
  // En-têtes modifiables : Next y ajoute la suppression du cookie de session.
  return new Response(null, {
    status: 303,
    headers: { Location: String(destination ?? `${urlApplication()}/`) },
  });
}
