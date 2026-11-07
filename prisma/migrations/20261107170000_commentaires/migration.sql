-- CreateTable
CREATE TABLE "commentaires" (
    "id" SERIAL NOT NULL,
    "contenu" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteur_id" INTEGER NOT NULL,
    "suggestion_id" INTEGER NOT NULL,

    CONSTRAINT "commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commentaires_suggestion_id_created_at_idx" ON "commentaires"("suggestion_id", "created_at");

-- CreateIndex
CREATE INDEX "commentaires_auteur_id_idx" ON "commentaires"("auteur_id");

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
