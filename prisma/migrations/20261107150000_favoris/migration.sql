-- CreateTable
CREATE TABLE "favoris" (
    "user_id" INTEGER NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoris_pkey" PRIMARY KEY ("user_id","suggestion_id")
);

-- CreateIndex
CREATE INDEX "favoris_suggestion_id_idx" ON "favoris"("suggestion_id");

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
