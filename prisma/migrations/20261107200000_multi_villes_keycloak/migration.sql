-- Application unique multi-villes + authentification Keycloak + modération.
-- Migration écrite pour conserver les données existantes : chaque valeur distincte de l'ancienne
-- colonne texte `localisations.ville` devient une ligne de `villes` (charte graphique par défaut).

-- CreateTable
CREATE TABLE "villes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "zoom" INTEGER NOT NULL DEFAULT 12,
    "couleur_principale" VARCHAR(7) NOT NULL,
    "couleur_principale_foncee" VARCHAR(7) NOT NULL,
    "couleur_accent" VARCHAR(7) NOT NULL,
    "logo_url" VARCHAR(500),

    CONSTRAINT "villes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "villes_nom_key" ON "villes"("nom");
CREATE UNIQUE INDEX "villes_slug_key" ON "villes"("slug");

-- Reprise des données : une ville par valeur distincte, centrée sur la moyenne de ses quartiers.
INSERT INTO "villes" ("nom", "slug", "latitude", "longitude", "zoom", "couleur_principale", "couleur_principale_foncee", "couleur_accent")
SELECT "ville",
       trim(both '-' from regexp_replace(lower("ville"), '[^a-z0-9]+', '-', 'g')),
       avg("latitude"), avg("longitude"), 12, '#1f4d3a', '#163a2b', '#f2b632'
FROM "localisations"
GROUP BY "ville";

ALTER TABLE "localisations" ADD COLUMN "ville_id" INTEGER;
UPDATE "localisations" l SET "ville_id" = v."id" FROM "villes" v WHERE v."nom" = l."ville";
ALTER TABLE "localisations" ALTER COLUMN "ville_id" SET NOT NULL;
ALTER TABLE "localisations" DROP COLUMN "ville";

-- Unicité des quartiers par ville (et non plus globale)
DROP INDEX "localisations_nom_key";
DROP INDEX "localisations_slug_key";
CREATE UNIQUE INDEX "localisations_ville_id_slug_key" ON "localisations"("ville_id", "slug");
CREATE UNIQUE INDEX "localisations_ville_id_nom_key" ON "localisations"("ville_id", "nom");

ALTER TABLE "localisations" ADD CONSTRAINT "localisations_ville_id_fkey" FOREIGN KEY ("ville_id") REFERENCES "villes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Catégories rattachées aux quartiers (many-to-many implicite Prisma)
CREATE TABLE "_CategorieToLocalisation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategorieToLocalisation_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_CategorieToLocalisation_B_index" ON "_CategorieToLocalisation"("B");

ALTER TABLE "_CategorieToLocalisation" ADD CONSTRAINT "_CategorieToLocalisation_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategorieToLocalisation" ADD CONSTRAINT "_CategorieToLocalisation_B_fkey" FOREIGN KEY ("B") REFERENCES "localisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise des données : jusqu'ici toutes les catégories étaient proposées partout.
INSERT INTO "_CategorieToLocalisation" ("A", "B")
SELECT c."id", l."id" FROM "categories" c CROSS JOIN "localisations" l;

-- Modération
ALTER TABLE "suggestions" ADD COLUMN "masquee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "masquee_le" TIMESTAMP(3),
ADD COLUMN "masquee_par_id" INTEGER,
ADD COLUMN "motif_masquage" VARCHAR(300);

CREATE INDEX "suggestions_masquee_idx" ON "suggestions"("masquee");

-- Keycloak
ALTER TABLE "users" ADD COLUMN "keycloak_id" VARCHAR(64);
CREATE UNIQUE INDEX "users_keycloak_id_key" ON "users"("keycloak_id");
