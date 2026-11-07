# CLAUDE.md

Ce fichier donne le contexte du projet à Claude Code et à l'équipe.

## Le projet

Application de **démocratie participative** réalisée pour le hackathon ESEO 2026 × Sogeti.

Les habitants d'une ville proposent des suggestions pour améliorer leur cadre de vie (voirie, espaces verts, mobilité, propreté…). Ils peuvent les géolocaliser, joindre des fichiers, les classer par catégorie et par tag, et voter pour ou contre les suggestions des autres. Les idées les plus soutenues ressortent, et la commune peut s'en servir pour prioriser ses actions.

### Contexte de la démo

- **Territoire** : Dijon Métropole, c'est-à-dire les quartiers de Dijon et les communes autour. La carte s'ouvre centrée sur Dijon, et le seed génère des suggestions fictives réparties sur ce territoire.
- **Rendu** : le **08/11/2026**, avec un **oral de 5 minutes**. On donne la priorité à un parcours de démo fluide plutôt qu'à l'exhaustivité.

### Exigences transverses

- **Multi-collectivités** : chaque collectivité a **sa propre instance** (déploiement + base de données). L'application reste donc mono-territoire : pas de notion de ville ou de collectivité dans le schéma. Pour l'étendre à une autre ville, il suffit de déployer une nouvelle instance avec sa base et sa configuration. Il ne faut donc rien coder en dur sur Dijon :
  - la configuration de l'instance (nom de la collectivité, centre et zoom de la carte) vient des variables d'environnement ou d'un fichier de config ;
  - la liste des localisations (quartiers de Dijon, communes de la métropole) est en base, alimentée par le seed de l'instance.
- **Scalabilité** : pagination et filtres côté serveur (Prisma), pas de chargement complet des tables, index sur les colonnes filtrées, et requêtes avec `_count` plutôt que des calculs en JS.
- **Accessibilité renforcée** (viser RGAA / WCAG 2.1 AA) :
  - HTML sémantique, labels sur tous les champs, navigation complète au clavier, focus visible ;
  - contrastes suffisants, information jamais portée par la seule couleur, `alt` sur les images ;
  - la carte n'est jamais le seul moyen d'accès : la liste offre toujours la même information ;
  - le choix d'une localisation doit rester possible sans la carte (ex. sélection dans la liste des localisations).
- **Parcours utilisateur clair** : peu d'étapes, libellés explicites en français, retours visibles après chaque action (suggestion créée, vote pris en compte), états vides et erreurs expliqués.

### Rôles

| Rôle | Ce qu'il peut faire |
|---|---|
| **Visiteur anonyme** | Consulter la liste, le détail et la carte des suggestions, avec leurs votes. |
| **Citoyen** (connecté) | Tout ce que fait le visiteur, plus créer une suggestion et voter (un seul vote par suggestion). |

Pas de rôle modérateur ni administrateur dans le périmètre actuel.

### MVP de la démo

1. **Liste + détail** : liste des suggestions avec filtres (catégorie, tag) et nombre de votes, puis page de détail (description, pièces jointes, localisation, votes).
2. **Création + votes** : formulaire de création (titre, description, catégories, tags, localisation, pièces jointes) et vote pour/contre.
3. **Carte** : suggestions géolocalisées affichées sur une carte. La bibliothèque reste à choisir (ex. Leaflet + OpenStreetMap).
4. **Connexion simulée** : **pas de vraie authentification**. Un simple login (choix ou saisie d'un `username`) simule la connexion d'un citoyen. Pas de mot de passe, pas d'inscription à gérer pour la démo.

### Hors périmètre (pour l'instant)

- Authentification réelle (next-auth et bcrypt sont installés mais pas utilisés pour la démo).
- Modération, back-office, gestion des statuts de suggestion côté mairie.

## Stack

- Next.js (`latest`, App Router, Turbopack en dev), React (`latest`), TypeScript 5.7
- Tailwind CSS 3.4 avec `@tailwindcss/forms`, et `@heroicons/react`
- Prisma 7 avec le driver adapter `@prisma/adapter-pg`, sur PostgreSQL
- zod pour la validation ; next-auth 5 (beta) et bcrypt sont présents mais hors MVP

Le projet part du starter « Next.js App Router Course » (Acme). Le code factures/clients du starter a été retiré. Il reste encore des éléments Acme à remplacer : logo, page d'accueil, `login-form`.

## Commandes

```bash
npm install          # postinstall : `prisma skills sync`
npm run dev          # http://localhost:3000
npm run build
```

Prisma (la config est dans `prisma7.config.ts`, pas dans le `prisma.config.ts` par défaut) :

```bash
npx prisma generate --config prisma7.config.ts       # génère le client dans /generated
npx prisma migrate dev --name <nom> --config prisma7.config.ts
npx prisma db push --config prisma7.config.ts
npx prisma studio --config prisma7.config.ts
npx tsx prisma/seed.ts                                # seed (pas de script "seed" déclaré)
```

Le dépôt contient un lockfile npm et un lockfile pnpm. `.npmrc` contient `ignore-workspace=true`, et `pnpm-workspace.yaml` impose `minimumReleaseAge`.

## Base de données

- `DATABASE_URL` vient de `.env` (copier `.env.example`). En local, la base tourne dans le conteneur Docker `hackaton-pg` : `postgresql://postgres:postgres@localhost:5433/hackaton_eseo_2026`. Le port 5433 est utilisé parce que le 5432 peut être pris par une autre instance PostgreSQL. pgAdmin : http://localhost:5050, hôte `hackaton-pg`, port 5432.
- Schéma : `prisma/schema.prisma`.
  - `User` : `username` unique, sans mot de passe (cohérent avec la connexion simulée).
  - `Suggestion` : titre, description, auteur.
  - `Vote` : `statut` booléen (`true` = pour, `false` = contre), unique par couple user/suggestion.
  - `PieceJointe` : URL d'un fichier rattaché à une suggestion.
  - `Tag`, `Categorie`, `Localisation` (latitude/longitude).
  - Relations many-to-many implicites : Suggestion↔Tag/Localisation/Categorie, Categorie↔Localisation.
- Migrations dans `prisma/migrations/`. Prisma 7 ne lance pas `generate` après `migrate dev` : le faire à la main.
- Le client est généré dans `/generated` (ignoré par git) et importé via `@/generated/client`.
- Le singleton client est dans `prisma/lib/dbcontext.ts` (`import { prisma } from "@/prisma/lib/dbcontext"`).
- Le seed `prisma/seed.ts` vide puis remplit toutes les tables avec des données fictives. Il peut être relancé autant de fois que nécessaire.

## Structure

- `app/` : routes App Router (`/`, `dashboard/`)
- `app/ui/` : composants
- `app/lib/utils.ts` : helpers génériques (dates, pagination)
- `app/query/route.ts` : route d'exemple qui utilise Prisma sur `Suggestion` (filtres, jointures, `_count`, DTO). À prendre comme modèle pour les requêtes.
- `.documentation/` : guides d'installation de Node.js, PostgreSQL et Prisma

## Conventions

- Le vocabulaire métier est en **français** (`Suggestion`, `Vote`, `PieceJointe`, `titre`…), et l'interface aussi.
- Toutes les requêtes passent par le client Prisma.
- Après toute modification de `schema.prisma` : `prisma generate`, et une migration si besoin.
- Git : la branche principale de travail est `develop`. Créer une branche par fonctionnalité, puis ouvrir une PR vers `develop`.
- **N'utiliser que des données fictives** (seed, tests, captures de démo). Aucune donnée personnelle réelle.
