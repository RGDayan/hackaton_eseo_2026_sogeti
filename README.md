# Place Commune

Plateforme de démocratie participative. Les habitants proposent des idées pour leur quartier, les situent sur une carte et votent pour ou contre celles de leurs voisins.

Une seule application sert plusieurs villes : on choisit la sienne via « Changer de ville », dans le bandeau en haut de page. Le contenu et les couleurs s'adaptent à la ville choisie. Tout le monde peut consulter les idées ; un compte suffit pour voter ou en proposer une.

Next.js 16, PostgreSQL, Prisma 7, Tailwind CSS 4, Leaflet avec OpenStreetMap, Keycloak 26.

## Installation

Il faut Node.js 22 et Docker.

1. Installez les dépendances :

   ```bash
   npm install
   ```

2. Copiez `.env.example` vers `.env` et renseignez au moins `DATABASE_URL` et `SESSION_SECRET`. Pour générer `SESSION_SECRET` :

   ```bash
   openssl rand -base64 48
   ```

   Les valeurs de Keycloak fournies dans `.env.example` fonctionnent telles quelles en local.

3. Démarrez Keycloak, puis, si vous n'avez pas déjà un PostgreSQL, celui de l'application :

   ```bash
   docker compose up -d                  # Keycloak sur http://localhost:8080
   docker compose --profile db up -d     # facultatif : PostgreSQL sur le port 5433
   ```

4. Créez les tables et chargez les données de démonstration :

   ```bash
   npm run db:setup
   ```

5. Lancez l'application sur http://localhost:3000 :

   ```bash
   npm run dev
   ```

### Si votre base date d'avant le multi-villes

Si votre base date d'avant le multi-villes, repartez de zéro. Ces commandes effacent toutes les données :

```bash
npx prisma migrate reset
npm run db:seed
```

Prisma 7 ne lance pas le seed après un `migrate reset`, d'où la deuxième commande.

## Comptes de démonstration

Ces comptes sont fictifs. Le mot de passe est le même pour tous : `Demo2026!`.

| Identifiant | Rôle |
| --- | --- |
| `habitant.demo` | Habitant : propose des idées et vote |
| `moderateur.dijon` | Modérateur de Dijon Métropole |
| `moderateur.besancon` | Modérateur du Grand Besançon |
| `admin.demo` | Super-admin |

Avec `MODE_DEMO="true"`, la page de connexion propose aussi des boutons qui connectent directement à ces profils, sans passer par Keycloak. Ils servent de filet de sécurité pendant une démonstration. **Ne jamais activer ce mode en production.**

La console d'administration de Keycloak est sur http://localhost:8080. Identifiant `admin`, mot de passe `admin`, en local uniquement.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Version de production |
| `npm run lint` | Vérification ESLint |
| `npm run db:setup` | Applique les migrations et charge les données de démonstration |
| `npm run db:seed` | Met à jour les villes, quartiers et catégories, et ajoute les idées de démo aux villes qui n'en ont pas |
| `npm run db:studio` | Ouvre Prisma Studio pour explorer la base |
| `docker compose up -d` / `down` | Démarre ou arrête Keycloak |

## Rôles

| Rôle | Où il est défini | Ce qu'il permet |
| --- | --- | --- |
| Visiteur | Pas de compte | Consulter les idées, la carte et les votes |
| Habitant | Tout compte Keycloak | Proposer des idées et voter, dans toutes les villes |
| Modérateur d'une ville | Groupe Keycloak `/villes/<slug>/moderateurs` | Masquer, rétablir ou supprimer des idées de sa ville ; gérer ses quartiers et créer des catégories |
| Super-admin | Rôle Keycloak `super-admin` | Tout, plus créer et paramétrer les villes et modifier les catégories |

Pour ajouter une ville : créez-la dans `/admin` avec le compte super-admin. Créez ensuite, dans la console Keycloak, le groupe `/villes/<slug>/moderateurs` et ajoutez-y ses modérateurs. Les droits sont relus à chaque connexion.

## Keycloak

- **Realm** : le realm `place-commune` est importé depuis `keycloak/realm-place-commune.json` au **premier** démarrage. Si vous modifiez ce fichier ensuite, réimportez-le avec `docker compose down -v`, puis `docker compose up -d`. Attention, cela efface les comptes créés dans Keycloak.
- **Inscription** : l'inscription est libre. Seuls un identifiant de 3 à 24 caractères et un mot de passe sont demandés ; l'e-mail est facultatif, sans nom ni prénom.
- **Thème** : les pages de connexion utilisent le thème `keycloak/themes/place-commune`. Elles reprennent le style de l'application et les couleurs de la ville en cours, lues via `GET /api/villes/<slug>/theme`. Les polices sont hébergées dans le thème. En développement, une modification du CSS se voit en rafraîchissant la page.
- **Keycloak ne démarre plus** (`error mounting … /opt/keycloak/themes/place-commune`) : cela arrive après être passé sur une branche sans le dossier `keycloak/themes`. Docker Desktop garde l'ancien dossier monté. Lancez `docker compose up -d --force-recreate keycloak`.

## Base de données

| Table | Contenu |
| --- | --- |
| `villes` | Les villes : nom, centre et zoom de la carte, couleurs de la charte |
| `localisations` | Les quartiers et communes d'une ville, avec leur position |
| `categories` | Les catégories d'idées et leur couleur, partagées entre villes |
| `_CategorieToLocalisation` | Les catégories proposées dans chaque quartier |
| `suggestions` | Les idées : position facultative, compteurs de votes, état de modération |
| `tags`, `_SuggestionToTag` | Les mots-clés, créés librement par les habitants |
| `pieces_jointes` | Les métadonnées des documents joints |
| `votes` | Un vote par habitant et par idée |
| `users` | Pseudo et identifiant Keycloak, sans autre donnée personnelle |

Le schéma se trouve dans `prisma/schema.prisma`. Les données de démonstration (Dijon Métropole et Grand Besançon Métropole) sont dans `prisma/seed.ts`.

## Bon à savoir

- **Votes multiples :** l'inscription ne vérifie pas d'adresse e-mail. Une même personne peut donc créer plusieurs comptes et voter plusieurs fois.
- **Documents joints :** ils sont stockés dans `uploads/` et seules leurs métadonnées vont en base. Sauvegardez ce dossier avec la base. Avec plusieurs instances de l'application ou un hébergeur sans disque persistant, il faut passer à un stockage objet (S3).
- **Formats acceptés :** PDF, PNG, JPG, WebP et DOCX, 3 fichiers de 5 Mo au maximum par idée. Le type est vérifié d'après le contenu du fichier.
- **Carte :** les tuiles viennent des serveurs publics d'OpenStreetMap, ce qui convient à un prototype. Pour un trafic réel, utilisez un fournisseur de tuiles dédié.
- **Accessibilité :** les couleurs saisies dans l'administration sont refusées si leur contraste est inférieur à 4,5:1.
