@AGENTS.md

# CLAUDE.md : Place Commune

Ce fichier récapitule le projet, ce qui a été fait et ce qui reste à faire. Il sert de contexte à Claude Code et à l'équipe. **À tenir à jour** à chaque étape importante. Pour l'installation et les comptes de démo, voir `README.md`.

## Le projet

**Place Commune** est une plateforme de **démocratie participative**, réalisée pour le **hackathon ESEO 2026 × Sogeti**.

Les habitants proposent des idées pour leur quartier, les situent sur une carte, y joignent des documents et votent pour ou contre celles de leurs voisins.

- **Démo** : le **08/11/2026**, oral de **5 minutes**. Villes de démo : **Dijon Métropole** et **Grand Besançon Métropole**.
- **Une seule application pour toutes les villes.** L'habitant choisit sa ville dans l'en-tête, et le choix est gardé dans le cookie `pc_ville`. Tout est filtré par ville : fil, carte, filtres, chiffres, formulaire. La charte graphique de la ville est appliquée à l'interface.
- **Authentification Keycloak** (OIDC). Rôles :
  - **visiteur** (sans compte) : consulte ;
  - **habitant** (tout compte) : propose des idées et vote ;
  - **modérateur d'une ville** (groupe Keycloak `/villes/<slug>/moderateurs`) : masque, rétablit ou supprime les idées de sa ville, gère ses quartiers et crée des catégories ;
  - **super-admin** (rôle `super-admin`) : gère tout, y compris les villes et les catégories.
- **Mode démo** (`MODE_DEMO=true`) : 4 profils fictifs connectés sans Keycloak. C'est le filet de sécurité de l'oral. Jamais en production.

### Cap produit

- **Rien de codé en dur sur une ville** : centre, zoom, couleurs, quartiers et catégories sont en base, et se gèrent dans `/admin`.
- **Scalabilité** : filtres, pagination et tris côté SQL, compteurs de votes dénormalisés, et une application sans état (session dans un cookie JWT). Seul `uploads/` est local.
- **Accessibilité renforcée** (viser RGAA / WCAG 2.1 AA) :
  - HTML sémantique, labels, navigation au clavier, focus visible ;
  - contraste de 4,5:1 minimum, **vérifié à la saisie des couleurs** (`src/lib/contraste.ts`) ;
  - la carte n'est jamais le seul moyen d'accès ;
  - le sélecteur de ville se valide par un bouton, sans envoi automatique au changement (WCAG 3.2.2).
- **Données personnelles minimales** : Keycloak ne demande qu'un identifiant et un mot de passe, l'e-mail est facultatif. L'application ne stocke que le pseudo et le `sub` Keycloak.

## État d'avancement

### Historique

| Étape | Contenu |
|---|---|
| Init, nettoyage | Starter Next.js « Acme » + Prisma 7, puis premier schéma « suggestions ». |
| MVP V1 (PR #1, `develop`) | Réécriture complète « Place Commune » sous `src/` : fil, recherche, filtres, carte, idées, votes, pièces jointes, connexion par pseudo. |
| Branche `feature/multi-villes-keycloak` | Multi-villes, Keycloak, modération (`83eaa72`) ; thème Keycloak (`d3b7220`) ; administration (`9e02f02`) ; documentation. |

### Fonctionnalités en place

- **Accueil (`/`)** : nom de la ville, chiffres clés de la ville, fil paginé (8 par page), recherche, filtres (quartier, catégorie, tag), tri (récentes, mieux notées), carte centrée sur la ville ou sur le quartier filtré.
- **Idée (`/idees/[id]`)** : détail, votes, documents, emplacement. Le panneau de modération apparaît pour la modération de la ville de l'idée. Une idée masquée renvoie 404 aux autres.
- **Proposer (`/idees/nouvelle`)** :
  - on choisit d'abord le quartier, et seules les catégories liées à ce quartier sont proposées ;
  - le serveur vérifie que le quartier appartient à la ville courante et que la catégorie est liée au quartier.
- **Connexion (`/connexion`)** : boutons « Se connecter » et « Créer un compte » vers Keycloak, encadré du mode démo, messages d'erreur (Keycloak indisponible, connexion annulée…).
- **Routes `/auth/*`** :
  - `login` : PKCE, state et nonce dans un cookie signé `pc_oidc`, transmission de la ville au thème ;
  - `callback` : crée ou retrouve le `User` par `keycloakId`, rend le pseudo unique, calcule les droits à partir de `roles` et `groups` ;
  - `logout` : POST, ferme aussi la session Keycloak (redirection 303).
- **Modération (`/moderation`)** : liste des idées masquées des villes modérées, avec un bouton pour les rétablir.
- **Administration** :
  - `/admin` : villes visibles et création d'une ville (super-admin) ;
  - `/admin/villes/<slug>` : paramètres et charte de la ville (super-admin), quartiers avec leurs catégories (modérateur de la ville), catégories (création par un modérateur, modification par le super-admin).
- **Thème Keycloak** (`keycloak/themes/place-commune`) :
  - style de l'application, avec les polices hébergées dans le thème ;
  - couleurs de la ville via `GET /api/villes/<slug>/theme` (route publique, CORS `*`).
- **Pièces jointes** : vérification du type par le contenu du fichier, stockage dans `uploads/`, servies par `/api/pieces-jointes/[id]` avec des en-têtes de sécurité.

### Pas encore fait / problèmes connus

- Les **Server Actions de modération et d'administration** n'ont été testées que par le code et le rendu des pages. Il faut les essayer dans le navigateur avant la démo.
- **Groupes Keycloak des modérateurs** : à créer à la main dans la console pour chaque nouvelle ville. L'automatisation via l'API d'admin Keycloak est à faire.
- **Modifications du realm** : le fichier `keycloak/realm-place-commune.json` n'est relu qu'au premier démarrage. Ensuite, il faut passer par `kcadm.sh` ou faire `docker compose down -v`.
- **Votes multiples** : l'inscription ne vérifie pas d'e-mail, donc une même personne peut créer plusieurs comptes et voter plusieurs fois.
- **Streaming** : `notFound()` et `redirect()` appelés dans un `<Suspense>` répondent avec un statut 200. La page 404 ou la redirection fonctionne côté navigateur.
- Pas de page **profil** (« mes idées », « mes votes »).
- **Pièces jointes sur disque local** : passer à un stockage S3 avant d'avoir plusieurs réplicas.
- **Déploiement** : pas encore fait (voir le cadrage ci-dessous).

## Stack

- **Next.js 16.4.5** (App Router, Turbopack, `cacheComponents`, `partialPrefetching`, Server Actions limitées à 16 Mo), **React 19.3**, TypeScript 5.
- **Tailwind CSS 4** : thème dans `src/app/globals.css`, que la ville surcharge via `--color-foret`, `--color-foret-fonce` et `--color-soleil`. Polices Fraunces et Instrument Sans.
- **Prisma 7.10.1** + `@prisma/adapter-pg`, sur **PostgreSQL**.
- **Keycloak 26.4** (docker compose, base PostgreSQL dédiée) + **openid-client 6** ; sessions dans un JWT signé par **jose**.
- **Leaflet 1.9** + **react-leaflet 5** ; **zod 4**.

> ⚠️ Next.js 16 introduit des changements cassants (voir `AGENTS.md`). Lire `node_modules/next/dist/docs/` avant d'écrire du code Next :
> - `PageProps`, `LayoutProps` et `RouteContext` sont des types globaux ;
> - les données dynamiques se lisent dans un `<Suspense>` ou après `connection()` ;
> - les cookies ne se modifient que dans une Server Action ou un Route Handler.

## Commandes

```bash
docker compose up -d                 # Keycloak (+ --profile db pour le PostgreSQL de l'app)
npm run dev                          # http://localhost:3000
npm run lint && npx tsc --noEmit
npm run db:setup                     # migrate deploy + seed
npm run db:seed                      # le seed seul
npx prisma migrate reset             # efface tout et rejoue les migrations, SANS seed (Prisma 7)
npx prisma migrate dev --name <nom>  # interactif ; sinon, `prisma migrate diff` puis migration écrite à la main
```

Après une modification du schéma : `npx prisma generate`, **puis redémarrer `npm run dev`**. Le client Prisma est un singleton gardé dans `globalThis`, et le rechargement à chaud ne le remplace pas.

## Configuration (`.env`, à partir de `.env.example`)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | PostgreSQL. En local : conteneur `hackaton-pg`, `localhost:5433/hackaton_eseo_2026` |
| `SESSION_SECRET` | Signature des cookies de session et de flux OIDC, 32 caractères minimum (`openssl rand -base64 48`) |
| `VILLE_PAR_DEFAUT` | Slug de la ville affichée quand le cookie est absent (`dijon`) |
| `APP_URL` | URL publique de l'application. Sert pour la redirect URI OIDC et la déconnexion |
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/place-commune` |
| `KEYCLOAK_CLIENT_ID` / `KEYCLOAK_CLIENT_SECRET` | Client confidentiel `place-commune-web`. Le secret de dev est à changer en production |
| `MODE_DEMO` | `true` affiche les connexions de démo sans Keycloak |

## Base de données (`prisma/schema.prisma`)

| Modèle (table) | Points clés |
|---|---|
| `Ville` (`villes`) | `slug` unique, centre et `zoom` de la carte, `couleurPrincipale`, `couleurPrincipaleFoncee`, `couleurAccent`, `logoUrl?` |
| `Localisation` (`localisations`) | Quartier ou commune d'une ville. Unicité de `slug` et de `nom` **par ville**. Relation many-to-many avec `Categorie` |
| `Categorie` (`categories`) | Partagée entre villes. `couleur` sert au texte des badges, avec un contraste vérifié |
| `Suggestion` (`suggestions`) | Une catégorie, un quartier (donc une ville), un auteur, des tags. Compteurs `votesPour`, `votesContre` et `score`. Modération : `masquee`, `motifMasquage`, `masqueeLe`, `masqueeParId` |
| `User` (`users`) | `nickname`, `nicknameKey` (unique, en minuscules), `keycloakId?` (unique ; absent pour les comptes du mode démo) |
| `Vote` (`votes`) | Clé `(userId, suggestionId)`, `valeur` +1 ou -1 |
| `PieceJointe`, `Tag` | Inchangés depuis le MVP |

- **Migrations** : `20261107121342_init`, puis `20261107200000_multi_villes_keycloak`. Cette dernière, écrite à la main, conserve les données existantes : l'ancienne colonne texte `ville` devient des lignes de `villes`.
- **Seed** (données fictives) :
  - 7 catégories ;
  - Dijon Métropole (8 quartiers et communes) et Grand Besançon (5 quartiers), avec leurs liens aux catégories ;
  - 8 voisins, et les idées de démo, ajoutées seulement aux villes qui n'ont encore aucune idée.

## Architecture (`src/`)

```
app/
  page.tsx, idees/[id], idees/nouvelle, connexion, moderation
  admin/page.tsx, admin/villes/[slug]/page.tsx, admin/actions.ts, admin/champs.tsx
  auth/{login,callback,logout}/route.ts        # flux OIDC
  api/pieces-jointes/[id]/route.ts, api/villes/[slug]/theme/route.ts
  actions.ts        # choisirVille, connexionDemo, voter, creerSuggestion, masquer/rétablir/supprimer
  layout.tsx        # en-tête : nom de la ville, sélecteur, menu ; ThemeVille
components/         # carte, filtres, idee-card, vote, formulaire-suggestion, menu-utilisateur,
                    # selecteur-ville, theme-ville, panneau-moderation, formulaire-admin
lib/
  db.ts             # singleton Prisma
  queries.ts        # lectures, toujours filtrées par villeId et sans les idées masquées
  ville.ts          # getVilleCourante() (cookie pc_ville), listerVilles()
  session.ts        # cookie JWT : sub, adm, mod (villes modérées), idt (id_token) ; getUtilisateur()
  droits.ts         # peutModerer, estModerateur, exigerModerateur, exigerSuperAdmin, villesDepuisGroupes
  oidc.ts           # discovery, urlConnexion, traiterCallback, urlDeconnexion
  validation.ts     # schémas zod (idée, motif, ville, quartier, catégorie), slugifier, cheminSur
  contraste.ts      # ratio de contraste WCAG
  uploads.ts        # fichiers joints
keycloak/realm-place-commune.json, keycloak/themes/place-commune/
docker-compose.yml
```

## Conventions

- **Français** pour le vocabulaire métier, l'interface et les messages. Colonnes en base en snake_case.
- **Lectures** dans `src/lib/queries.ts` : toujours passer le `villeId` de `getVilleCourante()`.
- **Écritures** : Server Actions, suivies de `revalidatePath("/", "layout")`.
- **Droits revérifiés dans chaque action** (`peutModerer`…) : masquer un bouton ne suffit pas. Côté pages, `exigerModerateur` et `exigerSuperAdmin`.
- Toute entrée utilisateur passe par zod. Toute couleur saisie passe le contrôle de contraste.
- Les fichiers serveur importent `server-only`. La carte Leaflet est chargée côté client uniquement et démontée quand la route est cachée (`<Activity>`).
- **Git** : branche par fonctionnalité depuis `develop`, puis PR vers `develop`. Commits en français.
- **Uniquement des données fictives** (seed, tests, comptes de démo, captures). Aucune donnée personnelle réelle.

## Cadrage du déploiement (à réaliser, Docker Compose simplifié)

- **Services** :
  - `app` : image Next.js `output: 'standalone'`, `prisma migrate deploy` au démarrage, volume `uploads/` ;
  - `postgres` : base de l'app ;
  - `keycloak` : mode `start`, avec sa propre base et le thème monté ;
  - `caddy` : reverse proxy et HTTPS.
- **Une seule URL publique** : l'app sur `/`, Keycloak sur `/auth` (`KC_HTTP_RELATIVE_PATH=/auth`, `KC_PROXY_HEADERS=xforwarded`). Il n'y a alors pas de problème entre domaines, ni pour les cookies ni pour la route de thème.
- **L'issuer doit être stable et identique** pour le navigateur et le serveur (`KC_HOSTNAME=https://<domaine>/auth`). Les URL aléatoires des quick tunnels Cloudflare ne conviennent donc pas : il faut un domaine fixe, par exemple le domaine statique gratuit de ngrok ou un tunnel Cloudflare nommé.
- **À adapter** : les redirect URIs du client Keycloak et `APP_URL` selon l'environnement ; `MODE_DEMO=false` en production ; un nouveau secret client.
