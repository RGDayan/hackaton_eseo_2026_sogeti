import Link from "next/link";
import { MenuMobile } from "@/components/menu-mobile";
import { estModerateur } from "@/lib/droits";
import { getUtilisateur } from "@/lib/session";

type Lien = { href: string; libelle: string };

/**
 * Navigation principale, pensée mobile d'abord :
 * - petit écran : bouton « Proposer » compact + menu déroulant (liens et compte) ;
 * - grand écran (lg) : liens en ligne, compte regroupé à droite.
 */
export async function Navigation() {
  const utilisateur = await getUtilisateur();

  const liens: Lien[] = [{ href: "/dashboard", libelle: "Tableau de bord" }];
  if (utilisateur) liens.push({ href: "/favoris", libelle: "Favoris" });
  if (estModerateur(utilisateur)) {
    liens.push({ href: "/moderation", libelle: "Modération" }, { href: "/admin", libelle: "Admin" });
  }

  const deconnexion = (classe: string) => (
    // Route Handler : ferme aussi la session Keycloak.
    <form action="/auth/logout" method="post">
      <button type="submit" className={classe}>
        Se déconnecter
      </button>
    </form>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Grand écran */}
      <nav aria-label="Navigation principale" className="hidden lg:block">
        <ul className="flex items-center gap-5 text-sm font-semibold">
          {liens.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-foret hover:underline">
                {l.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden items-center gap-3 border-l border-trait pl-5 text-sm lg:flex">
        {utilisateur ? (
          <>
            <span className="max-w-36 truncate font-semibold">{utilisateur.nickname}</span>
            {deconnexion("text-gris hover:text-encre hover:underline")}
          </>
        ) : (
          <Link href="/connexion" className="font-semibold text-foret hover:underline">
            Se connecter
          </Link>
        )}
      </div>

      <Link href="/idees/nouvelle" className="bouton-plein !px-4 sm:!px-5">
        Proposer<span className="hidden sm:inline"> une idée</span>
      </Link>

      {/* Petit écran */}
      <MenuMobile>
        <nav aria-label="Navigation principale">
          <ul className="divide-y divide-trait">
            {liens.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-3 font-semibold text-foret">
                  {l.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-trait pt-3 text-sm">
          {utilisateur ? (
            <>
              <span className="min-w-0 truncate">
                Connecté : <strong>{utilisateur.nickname}</strong>
              </span>
              {deconnexion("shrink-0 font-semibold text-gris hover:text-encre")}
            </>
          ) : (
            <Link href="/connexion" className="bouton-plein w-full">
              Se connecter
            </Link>
          )}
        </div>
      </MenuMobile>
    </div>
  );
}
