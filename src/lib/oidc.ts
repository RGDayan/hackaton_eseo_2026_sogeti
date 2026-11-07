import "server-only";
import { cookies } from "next/headers";
import * as client from "openid-client";
import { signerJeton, verifierJeton } from "@/lib/session";
import { cheminSur } from "@/lib/validation";

/** État temporaire du flux de connexion (PKCE, state, nonce, page de retour). */
const COOKIE_OIDC = "pc_oidc";
const DUREE_FLUX_SECONDES = 10 * 60;

function variable(nom: string) {
  const valeur = process.env[nom];
  if (!valeur) throw new Error(`${nom} doit être défini dans .env.`);
  return valeur;
}

export function urlApplication() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const urlCallback = () => `${urlApplication()}/auth/callback`;

let configuration: Promise<client.Configuration> | undefined;

/** Découverte OIDC de Keycloak, mise en cache dans le module. Réessayée si elle a échoué. */
export function getConfig() {
  configuration ??= (async () => {
    const issuer = new URL(variable("KEYCLOAK_ISSUER"));
    return client.discovery(
      issuer,
      variable("KEYCLOAK_CLIENT_ID"),
      variable("KEYCLOAK_CLIENT_SECRET"),
      undefined,
      // En local, Keycloak est servi en HTTP : autorisé uniquement pour un issuer non HTTPS.
      issuer.protocol === "http:" ? { execute: [client.allowInsecureRequests] } : undefined,
    );
  })().catch((e) => {
    configuration = undefined;
    throw e;
  });
  return configuration;
}

/** Prépare la redirection vers Keycloak et mémorise l'état du flux dans un cookie signé. */
export async function urlConnexion(suivant: string, inscription = false, ville?: string) {
  const config = await getConfig();
  const verifier = client.randomPKCECodeVerifier();
  const state = client.randomState();
  const nonce = client.randomNonce();

  (await cookies()).set(
    COOKIE_OIDC,
    await signerJeton({ v: verifier, s: state, n: nonce, next: cheminSur(suivant) }, DUREE_FLUX_SECONDES),
    {
      httpOnly: true,
      // Lax : le cookie revient avec la redirection GET de Keycloak vers /auth/callback.
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/auth",
      maxAge: DUREE_FLUX_SECONDES,
    },
  );

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: urlCallback(),
    scope: "openid profile",
    code_challenge: await client.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state,
    nonce,
    ui_locales: "fr",
    // Lu par le thème Keycloak (keycloak/themes/place-commune) pour appliquer la charte de la ville.
    ...(ville && { ville }),
  });
  // Keycloak ouvre directement le formulaire d'inscription sur ce point d'entrée.
  if (inscription) url.pathname = url.pathname.replace(/\/auth$/, "/registrations");
  return url;
}

export type IdentiteKeycloak = {
  sub: string;
  pseudo: string;
  roles: string[];
  groupes: unknown;
  idToken: string;
  suivant: string;
};

/** Échange le code contre les jetons et vérifie state, nonce et PKCE. */
export async function traiterCallback(parametres: URLSearchParams): Promise<IdentiteKeycloak> {
  const magasin = await cookies();
  const flux = await verifierJeton(magasin.get(COOKIE_OIDC)?.value);
  magasin.delete({ name: COOKIE_OIDC, path: "/auth" });
  if (!flux || typeof flux.v !== "string" || typeof flux.s !== "string" || typeof flux.n !== "string") {
    throw new Error("Flux de connexion expiré ou invalide.");
  }

  const config = await getConfig();
  // URL reconstruite depuis APP_URL : derrière un proxy, l'URL vue par Next peut différer.
  const urlCourante = new URL(`${urlCallback()}?${parametres.toString()}`);
  const jetons = await client.authorizationCodeGrant(config, urlCourante, {
    pkceCodeVerifier: flux.v,
    expectedState: flux.s,
    expectedNonce: flux.n,
    idTokenExpected: true,
  });

  const claims = jetons.claims();
  if (!claims || !jetons.id_token) throw new Error("Jeton d'identité absent.");

  return {
    sub: claims.sub,
    pseudo: typeof claims.preferred_username === "string" ? claims.preferred_username : claims.sub,
    roles: Array.isArray(claims.roles) ? claims.roles.filter((r): r is string => typeof r === "string") : [],
    groupes: claims.groups,
    idToken: jetons.id_token,
    suivant: cheminSur(flux.next),
  };
}

/** URL de déconnexion Keycloak (ferme aussi la session SSO), ou null si Keycloak est injoignable. */
export async function urlDeconnexion(idToken: string | undefined) {
  try {
    const config = await getConfig();
    return client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: `${urlApplication()}/`,
      ...(idToken && { id_token_hint: idToken }),
    });
  } catch {
    return null;
  }
}
