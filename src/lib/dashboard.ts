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
  localisation: { select: { nom: true, ville: { select: { nom: true } } } },
} satisfies Prisma.SuggestionSelect;

export type IdeeResume = Prisma.SuggestionGetPayload<{ select: typeof selectResume }>;

/** Chiffres de la ville courante : visibles par tout le monde, sans connexion. Sans les idées masquées. */
export async function getTableauDeBord(villeId: number) {
  await connection();
  const dansLaVille = { masquee: false, localisation: { villeId } } satisfies Prisma.SuggestionWhereInput;

  const [idees, nouvellesCetteSemaine, voisins, votesParValeur, groupesCategorie, groupesQuartier, categories, quartiers, topIdees] =
    await Promise.all([
      prisma.suggestion.count({ where: dansLaVille }),
      prisma.suggestion.count({
        where: { ...dansLaVille, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      // Voisins : habitants qui ont proposé ou voté dans la ville.
      prisma.user.count({
        where: {
          OR: [{ suggestions: { some: dansLaVille } }, { votes: { some: { suggestion: dansLaVille } } }],
        },
      }),
      prisma.vote.groupBy({ by: ["valeur"], where: { suggestion: dansLaVille }, _count: { _all: true } }),
      prisma.suggestion.groupBy({
        by: ["categorieId"],
        where: dansLaVille,
        _count: { _all: true },
        _sum: { votesPour: true, votesContre: true },
      }),
      prisma.suggestion.groupBy({
        by: ["localisationId"],
        where: dansLaVille,
        _count: { _all: true },
        _sum: { votesPour: true, votesContre: true },
      }),
      prisma.categorie.findMany({
        where: { localisations: { some: { villeId } } },
        select: { id: true, nom: true, slug: true, couleur: true },
      }),
      prisma.localisation.findMany({ where: { villeId }, select: { id: true, nom: true, slug: true } }),
      prisma.suggestion.findMany({
        where: dansLaVille,
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

/** Les idées proposées par l'habitant connecté, et les votes qu'elles ont réunis. */
export async function getEspacePerso(userId: number) {
  await connection();

  const miennes = await prisma.suggestion.findMany({
    where: { auteurId: userId, masquee: false },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: selectResume,
  });

  return {
    miennes,
    votesRecus: miennes.reduce((total, i) => total + i.votesPour + i.votesContre, 0),
  };
}