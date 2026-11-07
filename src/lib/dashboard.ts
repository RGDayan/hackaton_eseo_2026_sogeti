import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type LigneStat = {
  nom: string;
  slug: string;
  couleur: string;
  idees: number;
  votes: number;
};

const selectResume = {
  id: true,
  titre: true,
  votesPour: true,
  votesContre: true,
  score: true,
  categorie: { select: { nom: true, couleur: true } },
  localisation: { select: { nom: true } },
} satisfies Prisma.SuggestionSelect;

export type IdeeResume = Prisma.SuggestionGetPayload<{ select: typeof selectResume }>;

/** Chiffres de la plateforme : visibles par tout le monde, sans connexion. */
export async function getTableauDeBord() {
  await connection();

  const [idees, nouvellesCetteSemaine, voisins, votesParValeur, groupesCategorie, groupesQuartier, categories, quartiers, topIdees] =
    await Promise.all([
      prisma.suggestion.count(),
      prisma.suggestion.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.user.count(),
      prisma.vote.groupBy({ by: ["valeur"], _count: { _all: true } }),
      prisma.suggestion.groupBy({
        by: ["categorieId"],
        _count: { _all: true },
        _sum: { votesPour: true, votesContre: true },
      }),
      prisma.suggestion.groupBy({
        by: ["localisationId"],
        _count: { _all: true },
        _sum: { votesPour: true, votesContre: true },
      }),
      prisma.categorie.findMany({ select: { id: true, nom: true, slug: true, couleur: true } }),
      prisma.localisation.findMany({ select: { id: true, nom: true, slug: true } }),
      prisma.suggestion.findMany({
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: selectResume,
      })
    ]);

  const votesPour = votesParValeur.find((v) => v.valeur === 1)?._count._all ?? 0;
  const votesContre = votesParValeur.find((v) => v.valeur === -1)?._count._all ?? 0;

  const parCategorie: LigneStat[] = categories
    .map((c) => {
      const g = groupesCategorie.find((x) => x.categorieId === c.id);
      return {
        nom: c.nom,
        slug: c.slug,
        couleur: c.couleur,
        idees: g?._count._all ?? 0,
        votes: (g?._sum.votesPour ?? 0) + (g?._sum.votesContre ?? 0),
      };
    })
    .sort((a, b) => b.idees - a.idees || b.votes - a.votes);

  const parQuartier = quartiers
    .map((q) => {
      const g = groupesQuartier.find((x) => x.localisationId === q.id);
      return {
        nom: q.nom,
        slug: q.slug,
        idees: g?._count._all ?? 0,
        votes: (g?._sum.votesPour ?? 0) + (g?._sum.votesContre ?? 0),
      };
    })
    .sort((a, b) => b.idees - a.idees || b.votes - a.votes);

  return {
    idees,
    nouvellesCetteSemaine,
    voisins,
    votesPour,
    votesContre,
    topIdees,
    parCategorie,
    parQuartier,
  };
}

/** Ce qui concerne l'habitant connecté : ses favorites (votes « pour ») et ses propres idées. */
export async function getEspacePerso(userId: number) {
  await connection();

  const [favorites, miennes, votesDonnes] = await Promise.all([
    prisma.vote.findMany({
      where: { userId, valeur: 1 },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { suggestion: { select: selectResume } },
    }),
    prisma.suggestion.findMany({
      where: { auteurId: userId },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: selectResume,
    }),
    prisma.vote.count({ where: { userId } }),
  ]);

  return {
    favorites: favorites.map((v) => v.suggestion),
    miennes,
    votesDonnes,
    votesRecus: miennes.reduce((total, i) => total + i.votesPour + i.votesContre, 0),
  };
}