// Configuration de l'instance. Chaque collectivité a son propre déploiement :
// on ne code rien en dur sur une ville, tout vient des variables d'environnement.
export const config = {
  appNom: process.env.APP_NOM ?? 'Idées Citoyennes',
  collectiviteNom: process.env.COLLECTIVITE_NOM ?? 'Dijon Métropole',
};
