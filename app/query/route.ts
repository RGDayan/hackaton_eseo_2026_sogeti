import { prisma } from "@/prisma/lib/dbcontext";

async function listSuggestions() {
  // EXEMPLE DE FILTRE + SELECT AVEC JOINTURES
  const data = await prisma.suggestion.findMany({
    where: {
      tags: { some: { name: "Écologie" } }
    },
    select: {
      titre: true,
      User: {
        select: {
          username: true
        }
      },
      tags: {
        select: { name: true }
      },
      _count: {
        select: { votes: true }
      }
    }
  })

  // EXEMPLE D'UTILISATION D'UNE JOINTURE
  // const suggestions = await prisma.suggestion.findMany({
  //   include: {
  //     User: true,
  //     categories: true
  //   }
  // })
  // suggestions.forEach(suggestion => {
  //   console.log(suggestion.User.username, suggestion.categories.length);
  // })

  // EXEMPLE DE FORMATAGE POUR UN RESULTAT SPECIFIQUE DTO
  // const data = await prisma.suggestion.findMany({
  //   include: {
  //     User: true,
  //     votes: true
  //   }
  // });
  //
  // const result = data.map(suggestion => ({
  //   titre: suggestion.titre,
  //   auteur: suggestion.User.username,
  //   votesPour: suggestion.votes.filter(v => v.statut).length,
  //   votesContre: suggestion.votes.filter(v => !v.statut).length,
  // }))

  return data;
}

export async function GET() {
  try {
    return Response.json(await listSuggestions());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
