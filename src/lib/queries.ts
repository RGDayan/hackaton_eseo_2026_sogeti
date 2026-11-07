import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PAR_PAGE = 8;
const MAX_EPINGLES = 300;

export type Filtres = {
  q: string;
  quartier: string;
  categorie: string;
  tag: string;
  tri: "recentes" | "mieux-notees";
  page: number;
};

type ParamsUrl = Record<string, string | string[] | undefined>;

const texte = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 100) : "");

export function lireFiltres(params: ParamsUrl): Filtres {
  const page = Number(texte(params.page));
  return {
    q: texte(params.q),
    quartier: texte(params.quartier),
    categorie: texte(params.categorie),
    tag: texte(params.tag),
    tri: params.tri === "mieux-notees" ? "mieux-notees" : "recentes",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Toujours limité à la ville courante, et sans les idées masquées par la modération. */
function clauseWhere(f: Filtres, villeId: number): Prisma.SuggestionWhereInput {
  return {
    masquee: false,
    localisation: { villeId, ...(f.quartier && { slug: f.quartier }) },
    ...(f.categorie && { categorie: { slug: f.categorie } }),
    ...(f.tag && { tags: { some: { nom: f.tag } } }),
    ...(f.q && {
      OR: [
        { titre: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
      ],
    }),
  };
}

const champsCarte = {
  id: true,
  titre: true,
  description: true,
  votesPour: true,
  votesContre: true,
  createdAt: true,
  auteur: { select: { nickname: true } },
  categorie: { select: { nom: true, couleur: true } },
  localisation: { select: { nom: true, ville: { select: { nom: true, slug: true } } } },
  tags: { select: { nom: true }, orderBy: { nom: "asc" } },
  _count: { select: { piecesJointes: true, favoris: true } },
} satisfies Prisma.SuggestionSelect;

export async function listerSuggestions(f: Filtres, villeId: number) {
  await connection();
  const where = clauseWhere(f, villeId);
  const orderBy: Prisma.SuggestionOrderByWithRelationInput[] =
    f.tri === "mieux-notees" ? [{ score: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }];

  const [suggestions, total] = await Promise.all([
    prisma.suggestion.findMany({
      where,
      orderBy,
      take: PAR_PAGE,
      skip: (f.page - 1) * PAR_PAGE,
      select: champsCarte,
    }),
    prisma.suggestion.count({ where }),
  ]);
  return { suggestions, total, pages: Math.max(1, Math.ceil(total / PAR_PAGE)) };
}

export type SuggestionListee = Awaited<ReturnType<typeof listerSuggestions>>["suggestions"][number];

/** Toutes les idées filtrées qui ont une position, pas seulement celles de la page courante. */
export async function listerEpingles(f: Filtres, villeId: number) {
  await connection();
  const lignes = await prisma.suggestion.findMany({
    where: { ...clauseWhere(f, villeId), latitude: { not: null }, longitude: { not: null } },
    orderBy: { score: "desc" },
    take: MAX_EPINGLES,
    select: {
      id: true,
      titre: true,
      latitude: true,
      longitude: true,
      votesPour: true,
      votesContre: true,
      categorie: { select: { nom: true, couleur: true } },
    },
  });
  return lignes.map((l) => ({
    id: l.id,
    titre: l.titre,
    latitude: l.latitude as number,
    longitude: l.longitude as number,
    votesPour: l.votesPour,
    votesContre: l.votesContre,
    categorie: l.categorie.nom,
    couleur: l.categorie.couleur,
  }));
}

export async function getSuggestion(id: number) {
  await connection();
  return prisma.suggestion.findUnique({
    where: { id },
    select: {
      ...champsCarte,
      latitude: true,
      longitude: true,
      masquee: true,
      motifMasquage: true,
      piecesJointes: {
        select: { id: true, nomOriginal: true, typeMime: true, taille: true },
        orderBy: { id: "asc" },
      },
    },
  });
}

/** Quartiers de la ville (avec leurs catégories), catégories et tags utilisés dans la ville. */
export async function getReferentiels(villeId: number) {
  await connection();
  const [localisations, categories, tags] = await Promise.all([
    prisma.localisation.findMany({
      where: { villeId },
      orderBy: { nom: "asc" },
      select: {
        id: true,
        nom: true,
        slug: true,
        latitude: true,
        longitude: true,
        categories: { select: { id: true } },
      },
    }),
    prisma.categorie.findMany({
      where: { localisations: { some: { villeId } } },
      orderBy: { nom: "asc" },
    }),
    prisma.tag.findMany({
      where: { suggestions: { some: { masquee: false, localisation: { villeId } } } },
      orderBy: { nom: "asc" },
    }),
  ]);
  return {
    localisations: localisations.map(({ categories: liees, ...l }) => ({
      ...l,
      categorieIds: liees.map((c) => c.id),
    })),
    categories,
    tags,
  };
}

export async function getStatistiques(villeId: number) {
  await connection();
  const dansLaVille = { masquee: false, localisation: { villeId } } satisfies Prisma.SuggestionWhereInput;
  const [idees, votes, voisins] = await Promise.all([
    prisma.suggestion.count({ where: dansLaVille }),
    prisma.vote.count({ where: { suggestion: dansLaVille } }),
    // Voisins : habitants qui ont proposé ou voté dans la ville.
    prisma.user.count({
      where: {
        OR: [{ suggestions: { some: dansLaVille } }, { votes: { some: { suggestion: dansLaVille } } }],
      },
    }),
  ]);
  return { idees, votes, voisins };
}

/** Votes de l'utilisateur sur les idées données : { idSuggestion: 1 | -1 }. */
export async function getMesVotes(userId: number | undefined, ids: number[]) {
  if (!userId || ids.length === 0) return {} as Record<number, number>;
  const votes = await prisma.vote.findMany({
    where: { userId, suggestionId: { in: ids } },
    select: { suggestionId: true, valeur: true },
  });
  return Object.fromEntries(votes.map((v) => [v.suggestionId, v.valeur])) as Record<number, number>;
}

/** Parmi les idées données, celles que l'utilisateur a mises en favori. */
export async function getMesFavoris(userId: number | undefined, ids: number[]) {
  if (!userId || ids.length === 0) return new Set<number>();
  const favoris = await prisma.favori.findMany({
    where: { userId, suggestionId: { in: ids } },
    select: { suggestionId: true },
  });
  return new Set(favoris.map((f) => f.suggestionId));
}

/** Toutes les idées favorites de l'utilisateur, la plus récemment ajoutée en premier. */
export async function listerFavoris(userId: number) {
  await connection();
  const lignes = await prisma.favori.findMany({
    // Toutes villes confondues, sans les idées masquées par la modération.
    where: { userId, suggestion: { masquee: false } },
    orderBy: { createdAt: "desc" },
    select: { suggestion: { select: champsCarte } },
  });
  return lignes.map((l) => l.suggestion);
}
