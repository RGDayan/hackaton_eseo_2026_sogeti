import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/db";

const COOKIE = "pc_session";
const DUREE_SECONDES = 60 * 60 * 24 * 30;

function cle() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET doit être défini dans .env (32 caractères minimum).");
  }
  return new TextEncoder().encode(secret);
}

/** Signe un petit jeton HS256 avec SESSION_SECRET (session, état temporaire de la connexion OIDC…). */
export function signerJeton(contenu: JWTPayload, dureeSecondes: number) {
  return new SignJWT(contenu)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${dureeSecondes}s`)
    .sign(cle());
}

/** Vérifie un jeton signé par `signerJeton`. Renvoie null s'il est invalide ou expiré. */
export async function verifierJeton(jeton: string | undefined) {
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, cle(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/** Droits issus de Keycloak (ou du mode démo), recalculés à chaque connexion. */
export type Droits = {
  superAdmin: boolean;
  /** Slugs des villes que l'utilisateur modère. */
  villesModerees: string[];
};

export const AUCUN_DROIT: Droits = { superAdmin: false, villesModerees: [] };

export async function ouvrirSession(userId: number, droits: Droits = AUCUN_DROIT, idToken?: string) {
  const jeton = await signerJeton(
    {
      sub: String(userId),
      adm: droits.superAdmin,
      mod: droits.villesModerees,
      // Gardé pour fermer aussi la session Keycloak à la déconnexion.
      ...(idToken && { idt: idToken }),
    },
    DUREE_SECONDES,
  );

  (await cookies()).set(COOKIE, jeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_SECONDES,
  });
}

/** Ferme la session de l'application et renvoie l'id_token Keycloak éventuel. */
export async function fermerSession() {
  const magasin = await cookies();
  const contenu = await verifierJeton(magasin.get(COOKIE)?.value);
  magasin.delete(COOKIE);
  return typeof contenu?.idt === "string" ? contenu.idt : undefined;
}

export type Utilisateur = {
  id: number;
  nickname: string;
  estSuperAdmin: boolean;
  villesModerees: string[];
};

/** Utilisateur connecté, ou null. Mémorisé le temps de la requête. */
export const getUtilisateur = cache(async (): Promise<Utilisateur | null> => {
  const contenu = await verifierJeton((await cookies()).get(COOKIE)?.value);
  if (!contenu) return null;

  const userId = Number(contenu.sub);
  if (!Number.isInteger(userId)) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true },
  });
  if (!user) return null;

  return {
    ...user,
    estSuperAdmin: contenu.adm === true,
    villesModerees: Array.isArray(contenu.mod) ? contenu.mod.filter((v) => typeof v === "string") : [],
  };
});
