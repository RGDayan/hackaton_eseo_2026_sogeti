// Données de démonstration 100 % fictives (pseudos, idées, votes).
// Les noms de quartiers et de communes sont publics ; les coordonnées sont approximatives.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const categories = [
  { nom: "Mobilité", slug: "mobilite", couleur: "#1d6fa5" },
  { nom: "Espaces verts", slug: "espaces-verts", couleur: "#2f7d4f" },
  { nom: "Culture", slug: "culture", couleur: "#8a3fa0" },
  { nom: "Solidarité", slug: "solidarite", couleur: "#c2410c" },
  { nom: "Propreté", slug: "proprete", couleur: "#0f766e" },
  { nom: "Commerces", slug: "commerces", couleur: "#a16207" },
  { nom: "Sport & loisirs", slug: "sport-loisirs", couleur: "#b3261e" },
];

const toutes = categories.map((c) => c.slug);
const sauf = (...exclues: string[]) => toutes.filter((s) => !exclues.includes(s));

type Quartier = { nom: string; slug: string; latitude: number; longitude: number; categories: string[] };

type Ville = {
  nom: string;
  slug: string;
  latitude: number;
  longitude: number;
  zoom: number;
  // Couleurs vérifiées : contraste ≥ 4,5:1 sur le fond papier et avec un texte blanc.
  couleurPrincipale: string;
  couleurPrincipaleFoncee: string;
  couleurAccent: string;
  quartiers: Quartier[];
};

const villes: Ville[] = [
  {
    nom: "Dijon Métropole",
    slug: "dijon",
    latitude: 47.322,
    longitude: 5.0415,
    zoom: 12,
    couleurPrincipale: "#8c1c2b",
    couleurPrincipaleFoncee: "#6b1420",
    couleurAccent: "#e0a526",
    quartiers: [
      { nom: "Centre-ville", slug: "centre-ville", latitude: 47.3216, longitude: 5.0415, categories: sauf("sport-loisirs") },
      { nom: "Grésilles", slug: "gresilles", latitude: 47.333, longitude: 5.064, categories: toutes },
      { nom: "Fontaine d'Ouche", slug: "fontaine-d-ouche", latitude: 47.315, longitude: 5.005, categories: toutes },
      { nom: "Montchapet", slug: "montchapet", latitude: 47.333, longitude: 5.025, categories: sauf("commerces") },
      { nom: "Université", slug: "universite", latitude: 47.313, longitude: 5.068, categories: sauf("commerces") },
      { nom: "Chenôve", slug: "chenove", latitude: 47.293, longitude: 5.008, categories: toutes },
      { nom: "Talant", slug: "talant", latitude: 47.337, longitude: 5.005, categories: sauf("commerces") },
      { nom: "Quetigny", slug: "quetigny", latitude: 47.314, longitude: 5.106, categories: toutes },
    ],
  },
  {
    nom: "Grand Besançon Métropole",
    slug: "besancon",
    latitude: 47.2378,
    longitude: 6.0241,
    zoom: 13,
    couleurPrincipale: "#1d4f8c",
    couleurPrincipaleFoncee: "#163c6b",
    couleurAccent: "#f2b632",
    quartiers: [
      { nom: "La Boucle", slug: "la-boucle", latitude: 47.238, longitude: 6.024, categories: sauf("sport-loisirs") },
      { nom: "Battant", slug: "battant", latitude: 47.241, longitude: 6.018, categories: toutes },
      { nom: "Chaprais", slug: "chaprais", latitude: 47.247, longitude: 6.033, categories: toutes },
      { nom: "Planoise", slug: "planoise", latitude: 47.224, longitude: 5.97, categories: toutes },
      { nom: "Saint-Ferjeux", slug: "saint-ferjeux", latitude: 47.229, longitude: 5.993, categories: sauf("commerces") },
    ],
  },
];

const voisins = ["Camille", "Sasha", "Noa", "Yanis", "Inès", "Lou", "Malik", "Jade"];

type Idee = {
  titre: string;
  description: string;
  categorie: string;
  quartier: string;
  tags: string[];
  position?: [number, number];
  auteur: string;
  /** Nombre de soutiens (le second nombre, ancien « contre », est ignoré), attribués dans l'ordre des voisins. */
  votes: [number, number];
  ilYaJours: number;
};

const idees: Record<string, Idee[]> = {
  dijon: [
    {
      titre: "Une piste cyclable continue le long du lac Kir",
      description:
        "La piste s'interrompt à plusieurs endroits entre Fontaine d'Ouche et le lac, et oblige à rejoindre la route. Une liaison continue rendrait le trajet plus sûr pour les familles.",
      categorie: "mobilite",
      quartier: "fontaine-d-ouche",
      tags: ["vélo", "sécurité"],
      position: [47.3195, 5.0045],
      auteur: "Camille",
      votes: [6, 1],
      ilYaJours: 2,
    },
    {
      titre: "Un jardin partagé au pied des immeubles",
      description:
        "Une parcelle inoccupée pourrait accueillir des bacs potagers entretenus par les habitants, avec un composteur collectif et un point d'eau.",
      categorie: "espaces-verts",
      quartier: "gresilles",
      tags: ["jardin", "compost"],
      position: [47.3338, 5.0655],
      auteur: "Sasha",
      votes: [7, 0],
      ilYaJours: 5,
    },
    {
      titre: "Des bancs ombragés place de la Libération",
      description:
        "En été, la place est très exposée. Quelques bancs à l'ombre d'arbres ou de voiles permettraient aux personnes âgées de s'y arrêter.",
      categorie: "espaces-verts",
      quartier: "centre-ville",
      tags: ["accessibilité", "été"],
      position: [47.3217, 5.0412],
      auteur: "Noa",
      votes: [5, 2],
      ilYaJours: 8,
    },
    {
      titre: "Une boîte à livres près du tram",
      description:
        "Une boîte à livres à l'arrêt de tram permettrait d'échanger des romans et des livres pour enfants pendant l'attente.",
      categorie: "culture",
      quartier: "universite",
      tags: ["lecture", "tram"],
      position: [47.3128, 5.0672],
      auteur: "Yanis",
      votes: [4, 0],
      ilYaJours: 11,
    },
    {
      titre: "Un marché de producteurs le samedi matin",
      description:
        "Un petit marché hebdomadaire avec des producteurs locaux redonnerait vie à la place centrale et éviterait de prendre la voiture.",
      categorie: "commerces",
      quartier: "chenove",
      tags: ["circuit court", "marché"],
      position: [47.2925, 5.0075],
      auteur: "Inès",
      votes: [6, 2],
      ilYaJours: 3,
    },
    {
      titre: "Un city-stade rénové",
      description:
        "Le terrain multisport est abîmé : filets déchirés, sol glissant. Une rénovation profiterait aux jeunes du quartier.",
      categorie: "sport-loisirs",
      quartier: "quetigny",
      tags: ["jeunesse", "sport"],
      position: [47.3145, 5.1065],
      auteur: "Malik",
      votes: [5, 1],
      ilYaJours: 14,
    },
    {
      titre: "Plus de poubelles de tri sur le plateau",
      description:
        "Les promeneurs du dimanche n'ont pas de poubelle de tri sur le chemin. Deux ou trois points de collecte éviteraient les déchets dans l'herbe.",
      categorie: "proprete",
      quartier: "talant",
      tags: ["tri", "déchets"],
      auteur: "Lou",
      votes: [3, 1],
      ilYaJours: 6,
    },
    {
      titre: "Une épicerie solidaire éphémère",
      description:
        "Un local associatif pourrait accueillir une épicerie solidaire deux jours par semaine, en lien avec les associations du quartier.",
      categorie: "solidarite",
      quartier: "montchapet",
      tags: ["entraide"],
      position: [47.3335, 5.0245],
      auteur: "Jade",
      votes: [4, 2],
      ilYaJours: 19,
    },
  ],
  besancon: [
    {
      titre: "Une passerelle piétonne plus large vers Battant",
      description:
        "La passerelle est étroite pour les poussettes et les fauteuils roulants. Un élargissement ou un sens de circulation améliorerait le passage.",
      categorie: "mobilite",
      quartier: "battant",
      tags: ["accessibilité", "piétons"],
      position: [47.2405, 6.0195],
      auteur: "Sasha",
      votes: [6, 1],
      ilYaJours: 4,
    },
    {
      titre: "Des fontaines à eau dans la Boucle",
      description:
        "Il manque des points d'eau potable dans le centre. Deux fontaines aideraient les promeneurs et les touristes l'été.",
      categorie: "proprete",
      quartier: "la-boucle",
      tags: ["été", "eau"],
      position: [47.2382, 6.0245],
      auteur: "Camille",
      votes: [5, 0],
      ilYaJours: 7,
    },
    {
      titre: "Un festival de quartier aux Chaprais",
      description:
        "Une journée festive avec les commerçants, les écoles et les associations permettrait aux voisins de se rencontrer.",
      categorie: "culture",
      quartier: "chaprais",
      tags: ["fête", "associations"],
      position: [47.2468, 6.0328],
      auteur: "Lou",
      votes: [4, 1],
      ilYaJours: 9,
    },
    {
      titre: "Un parcours sportif dans le parc de Planoise",
      description:
        "Quelques agrès en libre accès le long des allées permettraient de faire du sport gratuitement, à tout âge.",
      categorie: "sport-loisirs",
      quartier: "planoise",
      tags: ["sport", "santé"],
      position: [47.2245, 5.9705],
      auteur: "Malik",
      votes: [7, 1],
      ilYaJours: 12,
    },
    {
      titre: "Un verger partagé à Saint-Ferjeux",
      description:
        "Planter quelques arbres fruitiers sur un terrain communal, avec une cueillette ouverte à tous et des ateliers pour les enfants.",
      categorie: "espaces-verts",
      quartier: "saint-ferjeux",
      tags: ["jardin", "biodiversité"],
      auteur: "Noa",
      votes: [3, 0],
      ilYaJours: 16,
    },
  ],
};

function joursAvant(jours: number) {
  return new Date(Date.now() - jours * 24 * 60 * 60 * 1000);
}

async function main() {
  for (const c of categories) {
    await prisma.categorie.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  const ids = new Map<string, number>();
  for (const nickname of voisins) {
    const nicknameKey = nickname.toLowerCase();
    const user = await prisma.user.upsert({
      where: { nicknameKey },
      update: {},
      create: { nickname, nicknameKey },
    });
    ids.set(nickname, user.id);
  }

  for (const { quartiers, ...donneesVille } of villes) {
    const ville = await prisma.ville.upsert({
      where: { slug: donneesVille.slug },
      update: donneesVille,
      create: donneesVille,
    });

    const quartierIds = new Map<string, number>();
    for (const { categories: cats, ...q } of quartiers) {
      const liens = cats.map((slug) => ({ slug }));
      const quartier = await prisma.localisation.upsert({
        where: { villeId_slug: { villeId: ville.id, slug: q.slug } },
        update: { ...q, categories: { set: liens } },
        create: { ...q, villeId: ville.id, categories: { connect: liens } },
      });
      quartierIds.set(q.slug, quartier.id);
    }

    // Les idées de démo ne sont ajoutées qu'à une ville sans idée, pour ne jamais doubler de vraies données.
    const existantes = await prisma.suggestion.count({ where: { localisation: { villeId: ville.id } } });
    if (existantes > 0) {
      console.log(`${ville.nom} : référentiels à jour, des idées existent déjà.`);
      continue;
    }

    for (const idee of idees[ville.slug] ?? []) {
      // Seul le premier nombre compte : il n'y a plus de vote « contre ».
      const [pour] = idee.votes;
      const suggestion = await prisma.suggestion.create({
        data: {
          titre: idee.titre,
          description: idee.description,
          latitude: idee.position?.[0],
          longitude: idee.position?.[1],
          votesPour: pour,
          votesContre: 0,
          score: pour,
          createdAt: joursAvant(idee.ilYaJours),
          auteur: { connect: { id: ids.get(idee.auteur)! } },
          categorie: { connect: { slug: idee.categorie } },
          localisation: { connect: { id: quartierIds.get(idee.quartier)! } },
          tags: {
            connectOrCreate: idee.tags.map((nom) => ({ where: { nom }, create: { nom } })),
          },
        },
      });

      await prisma.vote.createMany({
        data: voisins.slice(0, pour).map((nickname) => ({
          userId: ids.get(nickname)!,
          suggestionId: suggestion.id,
          valeur: 1,
        })),
      });
    }
    console.log(`${ville.nom} : ${idees[ville.slug]?.length ?? 0} idées de démonstration ajoutées.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
