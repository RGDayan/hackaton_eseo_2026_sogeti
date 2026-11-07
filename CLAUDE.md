@AGENTS.md

# CLAUDE.md : Place Commune

Ce fichier récapitule le projet, ce qui a été fait et ce qui reste à faire. Il sert de contexte à Claude Code et à l'équipe. **À tenir à jour** à chaque étape importante.

## Le projet

**Place Commune** est une plateforme de **démocratie participative**, réalisée pour le **hackathon ESEO 2026 × Sogeti**.

Les habitants proposent des idées pour améliorer leur quartier. Ils les situent sur une carte, y joignent des documents et votent pour ou contre les idées de leurs voisins. Les idées les mieux notées ressortent.

- **Démo** : le **08/11/2026**, oral de **5 minutes**.
- **Territoire de la démo** : **Dijon Métropole** (quartiers de Dijon et communes autour).
- **Rôles** :
  - **visiteur anonyme** : consulte les idées, la carte et les votes ;
  - **habitant connecté** : propose des idées et vote. Un simple pseudo suffit pour se connecter.
- **Pas de vraie authentification** : la connexion est simulée par un pseudo, sans mot de passe ni e-mail.

### Cap produit (décisions prises)

- **Une instance par collectivité.** Chaque collectivité a son propre déploiement et sa propre base. L'application elle-même ne gère qu'un territoire : pas de notion de ville ou de collectivité côté code. Pour une autre ville, on déploie une nouvelle instance avec un autre seed. **Ne rien coder en dur sur une ville** : les quartiers et le centre de la carte viennent de la base.
- **Scalabilité** : filtres, pagination et tris faits côté SQL ; les compteurs de votes sont dénormalisés pour pouvoir trier par score.
- **Accessibilité renforcée** (viser RGAA / WCAG 2.1 AA) :
  - HTML sémantique, champs avec label, navigation au clavier, focus visible ;
  - contrastes suffisants, et l'information n'est jamais portée par la seule couleur ;
  - la carte n'est jamais le seul moyen d'accès : la liste donne la même information.
- **Parcours utilisateur clair** : peu d'étapes, libellés en français, un retour visible après chaque action.

## État d'avancement

### Historique

| Étape | Contenu |
|---|---|
| Initialisation | Starter « Next.js App Router Course » (Acme) + intégration de Prisma 7, avec des exemples. |
| Documentation git | Ajout d'un guide `.documentation/4_utiliser_git.md`. |
| Nettoyage du dépôt | Suppression du code factures/clients d'Acme, premier schéma « suggestions », migration et seed. |
| **MVP V1** (commit `205030f`) | **Réécriture complète** : nouvelle application « Place Commune » sous `src/`, Next.js 16, Tailwind 4, Leaflet. Nouveau schéma, migration `20261107121342_init` et seed. Ce commit a supprimé l'ancien code `app/`, `.documentation/` et l'ancien CLAUDE.md (récupérables dans l'historique git). |

### Fonctionnalités en place (MVP V1)

- **Accueil (`/`)** :
  - chiffres clés (idées, votes, voisins) ;
  - fil d'idées paginé (8 par page) ;
  - **recherche** plein texte (titre et description) et **filtres** par quartier, catégorie et tag ;
  - **tri** par idées récentes ou mieux notées ;
  - **carte** Leaflet/OpenStreetMap des idées filtrées qui ont une position (300 épingles maximum, aux couleurs de leur catégorie).
- **Détail d'une idée (`/idees/[id]`)** : description, catégorie, quartier, tags, auteur, position, pièces jointes, votes.
- **Proposer une idée (`/idees/nouvelle`)** :
  - champs : titre, description, catégorie, quartier, jusqu'à 5 tags (créés librement), position facultative sur la carte, jusqu'à 3 fichiers de 5 Mo ;
  - validation zod, avec un message d'erreur par champ ;
  - nécessite d'être connecté (sinon, redirection vers `/connexion?next=…`).
- **Votes** :
  - un vote par habitant et par idée ; revoter dans le même sens retire le vote, voter dans l'autre sens le remplace ;
  - un vote est fait dans une transaction qui met aussi à jour les compteurs `votesPour`, `votesContre` et `score`.
- **Connexion simulée (`/connexion`)** :
  - le pseudo (3 à 24 caractères) crée l'utilisateur s'il n'existe pas (pas de distinction majuscules/minuscules) ;
  - la session est stockée dans un cookie JWT signé (`jose`, HS256, valable 30 jours) ;
  - la redirection après connexion n'accepte que des chemins internes (`cheminSur`).
- **Pièces jointes** :
  - formats PDF, PNG, JPG, WebP, DOCX ; le type est vérifié d'après le **contenu** du fichier ;
  - fichiers stockés dans `uploads/` (hors de `public/`, ignoré par git) ;
  - servis par `/api/pieces-jointes/[id]` avec des en-têtes de sécurité (`nosniff`, CSP sandbox) ; les images s'affichent, les autres fichiers se téléchargent.
- **Pages d'erreur** : `error.tsx` et `not-found.tsx`.

### Pas encore fait / problèmes connus

- **Le seed est sur Angers** (quartiers, coordonnées, descriptions « le long de la Maine »). Il faut le passer sur **Dijon Métropole** pour la démo.
- Pas de page **profil** (« mes idées », « mes votes »), malgré le message du commit MVP.
- **Pseudos non protégés** : n'importe qui peut utiliser un pseudo existant, et une même personne peut voter plusieurs fois avec plusieurs pseudos. C'est accepté pour la démo.
- **Pièces jointes sur disque local** : il faudra un stockage objet (S3/MinIO) dès qu'il y aura plusieurs réplicas ou un hébergeur sans disque persistant.
- **Tuiles OpenStreetMap publiques** : à remplacer par un fournisseur dédié si le trafic devient réel.
- **Modifications non committées** dans `package.json` : `eslint-config-next` est passé en `^15.5.29` alors que Next est en 16.4.5 (à réaligner sur `16.4.5`), et un bloc `allowScripts` a été ajouté.
- **Déploiement mis en pause.** Le récapitulatif des choix (k3d/k3s, chart Helm par collectivité, CloudNativePG, MinIO, Redis, Prometheus/Grafana/Loki, HPA + k6, tunnels Cloudflare pour la mise en ligne gratuite) se trouve dans `gitignore/deploiement-recap.md`. C'est un fichier **local**, ignoré par git.

## Stack

- **Next.js 16.4.5** (App Router, Turbopack), **React 19.3**, TypeScript 5
  - `cacheComponents` et `partialPrefetching` activés ;
  - Server Actions avec `bodySizeLimit: 16mb` (pour les fichiers joints).
- **Tailwind CSS 4** (via `@tailwindcss/turbopack`, thème dans `src/app/globals.css`) ; polices Fraunces (titres) et Instrument Sans (texte).
- **Prisma 7.10.1** + `@prisma/adapter-pg` (driver `pg`), sur **PostgreSQL**.
- **Leaflet 1.9** + **react-leaflet 5**, avec les tuiles OpenStreetMap.
- **zod 4** pour la validation, **jose** pour les JWT de session.
- Node.js 22.

> ⚠️ Next.js 16 introduit des changements cassants (voir `AGENTS.md`). Lire la doc dans `node_modules/next/dist/docs/` avant d'écrire du code Next : `PageProps`/`LayoutProps`/`RouteContext` globaux, `connection()`, `<Activity>`…

## Commandes

```bash
npm install          # postinstall : prisma generate
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint

npm run db:setup     # prisma migrate deploy + prisma db seed (base vide)
npm run db:seed      # recharge catégories et quartiers (+ idées de démo si aucune idée)
npm run db:studio    # Prisma Studio
npx prisma migrate reset   # repart de zéro : supprime tout, rejoue les migrations, lance le seed
npx prisma migrate dev --name <nom>   # nouvelle migration après modification du schéma
```

La configuration Prisma est dans `prisma.config.ts`, qui charge `.env` via `dotenv` et déclare le seed `tsx prisma/seed.ts`.

## Configuration (`.env`, à partir de `.env.example`)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `SESSION_SECRET` | Clé de signature des sessions, **32 caractères minimum**. Sinon, la connexion renvoie une erreur 500. Générer avec `openssl rand -base64 48`. |

En local, la base tourne dans le conteneur Docker **`hackaton-pg`** : `postgresql://postgres:postgres@localhost:5433/hackaton_eseo_2026`. Le port 5432 peut être pris par une autre instance PostgreSQL. pgAdmin : http://localhost:5050. `.env.example` propose `localhost:5432/place_commune` par défaut : à adapter.

Si une ancienne base existe, avec les tables `User`, `Suggestion`… créées par la migration `20261107122840_init`, l'application renvoie l'erreur `P2021 TableDoesNotExist`. Lancer alors `npx prisma migrate reset`.

## Base de données (`prisma/schema.prisma`)

Les tables sont en snake_case au pluriel (`@@map`), avec des identifiants `Int` auto-incrémentés.

| Modèle (table) | Points clés |
|---|---|
| `User` (`users`) | `nickname` + `nicknameKey` (minuscules, unique). Aucune donnée personnelle. |
| `Suggestion` (`suggestions`) | Titre, description, position `latitude`/`longitude` facultative, compteurs dénormalisés `votesPour`/`votesContre`/`score`. Liens : **une** catégorie, **un** quartier (`Localisation`), un auteur, des tags. Index sur `createdAt`, `score`, `categorieId`, `localisationId`. |
| `Categorie` (`categories`) | `nom`, `slug`, `couleur` (#rrggbb, utilisée pour les badges et les épingles). |
| `Localisation` (`localisations`) | Un quartier : `nom`, `slug`, `ville`, `latitude`/`longitude` (centre de la carte quand on filtre). |
| `Tag` (`tags`) | `nom` unique. Relation many-to-many implicite avec `Suggestion`. |
| `PieceJointe` (`pieces_jointes`) | Métadonnées seulement (`nomOriginal`, `nomStockage` UUID, `typeMime`, `taille`). |
| `Vote` (`votes`) | Clé primaire `(userId, suggestionId)`, `valeur` +1 ou -1. |

Le client est généré dans `src/generated/prisma` (ignoré par git) et importé via `@/generated/prisma/client`.

**Seed** (`prisma/seed.ts`), données fictives :
- 7 catégories et 7 quartiers, mis à jour à chaque lancement (`upsert`) ;
- 8 voisins (pseudos) et 11 idées avec leurs votes, ajoutés **uniquement si la table `suggestions` est vide**.

## Architecture (`src/`)

```
src/
  app/
    page.tsx                  # accueil : chiffres, filtres, fil paginé, carte
    idees/[id]/page.tsx       # détail d'une idée
    idees/nouvelle/page.tsx   # formulaire de proposition
    connexion/page.tsx        # connexion par pseudo
    api/pieces-jointes/[id]/route.ts  # sert un fichier joint
    actions.ts                # Server Actions : seConnecter, seDeconnecter, voter, creerSuggestion
    layout.tsx, globals.css, error.tsx, not-found.tsx
  components/                 # carte (+ chargement différé), filtres, idee-card, vote,
                              # formulaire-suggestion, formulaire-connexion, menu-utilisateur
  lib/
    db.ts                     # singleton PrismaClient (server-only)
    queries.ts                # toutes les lectures : filtres d'URL, listes, épingles, détail, stats
    session.ts                # cookie JWT, getUtilisateur() (mis en cache pour la requête)
    validation.ts             # schémas zod, limites, cheminSur()
    uploads.ts                # vérification du type par le contenu, écriture/lecture dans uploads/
  generated/prisma/           # client Prisma généré (ignoré par git)
```

## Conventions

- **Vocabulaire métier et interface en français** (`suggestion`, `quartier`, `voter`, `lireFiltres`…). Les colonnes en base sont en snake_case.
- **Lectures** dans `src/lib/queries.ts`, avec `await connection()` pour le rendu dynamique. **Écritures** dans les Server Actions de `src/app/actions.ts`, suivies de `revalidatePath`.
- Les fichiers serveur importent `server-only`.
- Toute entrée utilisateur passe par un schéma zod (`src/lib/validation.ts`).
- Toute modification de `schema.prisma` s'accompagne d'une migration `prisma migrate dev`. Ne jamais modifier une migration déjà partagée.
- La carte Leaflet est chargée côté client uniquement (`carte-lazy.tsx`). Elle est démontée quand la route est cachée (`<Activity>`), sinon l'application plante.
- **Git** : branche d'intégration `develop`, une branche par fonctionnalité, PR vers `develop`.
- **Uniquement des données fictives** (seed, tests, captures de démo), et aucune donnée personnelle réelle.
