// Seed de développement : données 100 % fictives.
// Lancement : npx tsx prisma/seed.ts
import "dotenv/config";
import { prisma } from "@/prisma/lib/dbcontext";

async function reset() {
    // Ordre inverse des dépendances. Les tables de liaison many-to-many
    // implicites sont vidées automatiquement avec Suggestion / Categorie.
    await prisma.vote.deleteMany();
    await prisma.pieceJointe.deleteMany();
    await prisma.suggestion.deleteMany();
    await prisma.categorie.deleteMany();
    await prisma.localisation.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
}

async function main() {
    await reset();

    // 1. Entités sans dépendance
    const [demo1, demo2, demo3] = await Promise.all(
        ["utilisateur_demo_1", "utilisateur_demo_2", "utilisateur_demo_3"].map((username) =>
            prisma.user.create({ data: { username } })
        )
    );

    const [tagSecurite, tagAccessibilite, tagEcologie, tagMobilier] = await Promise.all(
        ["Sécurité", "Accessibilité", "Écologie", "Mobilier urbain"].map((name) =>
            prisma.tag.create({ data: { name } })
        )
    );

    const [locCentre, locParc, locGare] = await Promise.all([
        prisma.localisation.create({ data: { latitude: 47.4736, longitude: -0.5541 } }),
        prisma.localisation.create({ data: { latitude: 47.4612, longitude: -0.5503 } }),
        prisma.localisation.create({ data: { latitude: 47.4648, longitude: -0.5568 } }),
    ]);

    const [catVoirie, catEspacesVerts, catTransports] = await Promise.all([
        prisma.categorie.create({
            data: { name: "Voirie", localisations: { connect: [{ id: locCentre.id }, { id: locGare.id }] } },
        }),
        prisma.categorie.create({
            data: { name: "Espaces verts", localisations: { connect: [{ id: locParc.id }] } },
        }),
        prisma.categorie.create({
            data: { name: "Transports", localisations: { connect: [{ id: locGare.id }] } },
        }),
    ]);

    // 2. Suggestions, reliées à leur auteur, tags, catégories, localisations
    const bancs = await prisma.suggestion.create({
        data: {
            titre: "Ajouter des bancs dans le parc",
            description: "Il manque des places assises le long de l'allée principale.",
            User: { connect: { id: demo1.id } },
            tags: { connect: [{ id: tagMobilier.id }, { id: tagAccessibilite.id }] },
            categories: { connect: [{ id: catEspacesVerts.id }] },
            localisations: { connect: [{ id: locParc.id }] },
            pieceJointes: { create: [{ url: "https://example.com/pj/parc-allee.jpg" }] },
        },
    });

    const eclairage = await prisma.suggestion.create({
        data: {
            titre: "Améliorer l'éclairage près de la gare",
            description: "Le passage piéton côté parking est mal éclairé le soir.",
            User: { connect: { id: demo2.id } },
            tags: { connect: [{ id: tagSecurite.id }] },
            categories: { connect: [{ id: catVoirie.id }, { id: catTransports.id }] },
            localisations: { connect: [{ id: locGare.id }] },
        },
    });

    const compost = await prisma.suggestion.create({
        data: {
            titre: "Installer un composteur collectif",
            description: "Un composteur partagé en centre-ville réduirait les déchets.",
            User: { connect: { id: demo3.id } },
            tags: { connect: [{ id: tagEcologie.id }] },
            categories: { connect: [{ id: catEspacesVerts.id }] },
            localisations: { connect: [{ id: locCentre.id }] },
            pieceJointes: {
                create: [
                    { url: "https://example.com/pj/composteur-modele.pdf" },
                    { url: "https://example.com/pj/emplacement.jpg" },
                ],
            },
        },
    });

    // 3. Votes (un seul vote par utilisateur et par suggestion : @@unique)
    await prisma.vote.createMany({
        data: [
            { userId: demo2.id, suggestionId: bancs.id, statut: true },
            { userId: demo3.id, suggestionId: bancs.id, statut: true },
            { userId: demo1.id, suggestionId: eclairage.id, statut: true },
            { userId: demo3.id, suggestionId: eclairage.id, statut: false },
            { userId: demo1.id, suggestionId: compost.id, statut: true },
        ],
    });

    console.log("Seed terminé.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
