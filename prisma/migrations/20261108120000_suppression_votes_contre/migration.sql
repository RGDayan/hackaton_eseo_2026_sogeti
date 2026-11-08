-- Le vote « contre » est retiré de l'application : un vote est désormais un soutien.
-- Les colonnes votes_contre et score sont conservées (toujours 0 et égal à votes_pour)
-- pour ne pas casser les branches en cours ; elles pourront être supprimées plus tard.
DELETE FROM "votes" WHERE "valeur" <> 1;

UPDATE "suggestions" s
SET "votes_pour" = (SELECT COUNT(*) FROM "votes" v WHERE v."suggestion_id" = s."id"),
    "votes_contre" = 0,
    "score" = (SELECT COUNT(*) FROM "votes" v WHERE v."suggestion_id" = s."id");
