import Link from "next/link";
import { estModerateur } from "@/lib/droits";
import { getUtilisateur } from "@/lib/session";

export async function MenuUtilisateur() {
  const utilisateur = await getUtilisateur();

  if (!utilisateur) {
    return (
      <Link href="/connexion" className="text-sm font-semibold text-foret hover:underline">
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {estModerateur(utilisateur) && (
        <>
          <Link href="/moderation" className="font-semibold text-foret hover:underline">
            Modération
          </Link>
          <Link href="/admin" className="font-semibold text-foret hover:underline">
            Admin
          </Link>
        </>
      )}
      <span className="hidden max-w-40 truncate font-semibold sm:inline">{utilisateur.nickname}</span>
      {/* Route Handler : ferme aussi la session Keycloak. */}
      <form action="/auth/logout" method="post">
        <button type="submit" className="text-gris hover:text-encre hover:underline">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
