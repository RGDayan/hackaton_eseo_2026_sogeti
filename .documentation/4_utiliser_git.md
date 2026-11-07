# Git et travail collaboratif

## 1. Qu'est-ce que Git ?

Git est un système de gestion de versions. Il permet de :

- suivre les modifications d'un projet ;
- revenir à une version précédente ;
- travailler à plusieurs sur le même code ;
- créer des branches pour développer des fonctionnalités séparément ;
- fusionner les modifications de plusieurs développeurs.

GitHub, GitLab et Bitbucket sont des plateformes permettant d'héberger des dépôts Git à distance.

## 2. Configuration initiale

Configurer son identité :

```bash
git config --global user.name "Prénom Nom"
git config --global user.email "email@example.com"
```

Vérifier la configuration :

```bash
git config --list
```

## 3. Récupérer un projet

### Cloner un dépôt

La commande `git clone` copie un dépôt distant sur l'ordinateur local :

```bash
git clone https://github.com/utilisateur/projet.git
cd projet
```

## 4. Vérifier l'état du projet

```bash
git status
```

Cette commande indique les fichiers modifiés, ajoutés à l'index ou non suivis par Git.

Afficher l'historique :

```bash
git log
git log --oneline
```

Afficher les différences non enregistrées :

```bash
git diff
```

## 5. Modifier et enregistrer son travail

Ajouter un fichier à l'index :

```bash
git add fichier.js
```

Ajouter toutes les modifications :

```bash
git add .
```

Créer un commit :

```bash
git commit -m "Ajout de la page de connexion"
```

Un commit enregistre les modifications localement. Les messages doivent être courts et explicites.

## 6. Synchroniser avec le dépôt distant

### Envoyer ses modifications

```bash
git push
```

Pour envoyer une nouvelle branche :

```bash
git push -u origin nom-de-branche
```

### Récupérer les modifications

La commande `git pull` récupère les modifications distantes et les intègre dans la branche locale :

```bash
git pull
```

Elle correspond généralement à :

```bash
git fetch
git merge
```

Il est recommandé d'exécuter `git pull` avant de commencer son travail afin de travailler sur une version à jour.

## 7. Utiliser les branches

Une branche permet de travailler sur une fonctionnalité sans modifier directement la branche principale.

Afficher les branches :

```bash
git branch
```

Créer une branche et se positionner dessus :

```bash
git switch -c feature/connexion
```

Changer de branche :

```bash
git switch feature/connexion
```

Supprimer une branche locale :

```bash
git branch -d feature/connexion
```

## 8. Fusionner des branches

La commande `git merge` intègre les modifications d'une branche dans la branche courante :

```bash
git switch develop
git merge feature/connexion
```

### Résoudre un conflit

Un conflit apparaît lorsque Git ne peut pas fusionner automatiquement deux modifications.

1. Identifier les fichiers concernés :

   ```bash
   git status
   ```

2. Ouvrir les fichiers en conflit et choisir la bonne version du code.
3. Supprimer les marqueurs `<<<<<<<`, `=======` et `>>>>>>>`.
4. Ajouter les fichiers corrigés :

   ```bash
   git add fichier-concerne.js
   ```

5. Terminer la fusion :

   ```bash
   git commit -m "Résolution des conflits de fusion"
   ```

Annuler une fusion en cours :

```bash
git merge --abort
```

## 9. GitFlow

GitFlow est une méthode d'organisation des branches Git. Elle définit un modèle commun pour développer, tester et publier une application.

### Branches principales

#### `main`

Contient le code stable et disponible en production.

#### `develop`

Contient les dernières fonctionnalités validées avant leur mise en production.

### Branches temporaires

#### `feature/*`

Utilisées pour développer une fonctionnalité :

```bash
git switch develop
git switch -c feature/gestion-utilisateurs
```

Une fois la fonctionnalité terminée, elle est fusionnée dans `develop`.

#### `release/*`

Utilisées pour préparer une nouvelle version :

```bash
git switch develop
git switch -c release/1.2.0
```

Elles servent notamment à corriger les derniers bugs, mettre à jour la version et finaliser la documentation. Elles sont ensuite fusionnées dans `main` et `develop`.

#### `hotfix/*`

Utilisées pour corriger rapidement un problème en production :

```bash
git switch main
git switch -c hotfix/correction-securite
```

Une fois la correction terminée, elles sont fusionnées dans `main` et `develop`.

### Schéma GitFlow

```text
main      ─────●──────────────●────────
               ▲              ▲
               │ release      │ hotfix
develop   ─●────●────●────────●────────
           ▲    ▲
           │    │
feature ───●────┘
```

## 10. Exemple de workflow collaboratif

```bash
# Récupérer le projet
git clone https://github.com/utilisateur/projet.git
cd projet

# Mettre à jour develop
git switch develop
git pull origin develop

# Créer une branche de fonctionnalité
git switch -c feature/nouvelle-fonctionnalite

# Développer puis enregistrer les changements
git add .
git commit -m "Ajout d'une nouvelle fonctionnalité"

# Envoyer la branche sur le dépôt distant
git push -u origin feature/nouvelle-fonctionnalite
```

Une Pull Request ou Merge Request peut ensuite être créée afin de faire relire le code et de le fusionner dans `develop`.

## 11. Bonnes pratiques

- Toujours récupérer les dernières modifications avant de commencer.
- Utiliser une branche par fonctionnalité ou correction.
- Faire des commits petits et cohérents.
- Rédiger des messages de commit explicites.
- Ne pas travailler directement sur `main`.
- Relire et tester son code avant de créer une Pull Request.
- Résoudre les conflits rapidement.
- Ne jamais versionner de mots de passe, clés API ou fichiers sensibles.
- Utiliser un fichier `.gitignore`.

Exemple de `.gitignore` :

```text
node_modules/
.env
dist/
.next/
```

## 12. Commandes essentielles

| Commande | Utilisation |
|---|---|
| `git clone URL` | Copier un dépôt distant |
| `git status` | Vérifier l'état du projet |
| `git add .` | Ajouter les modifications à l'index |
| `git commit -m "message"` | Enregistrer les modifications |
| `git pull` | Récupérer et intégrer les modifications distantes |
| `git push` | Envoyer les commits vers le dépôt distant |
| `git branch` | Afficher les branches |
| `git switch nom` | Changer de branche |
| `git switch -c nom` | Créer une branche |
| `git merge nom` | Fusionner une branche |
| `git log` | Consulter l'historique |
| `git diff` | Consulter les différences |
| `git stash` | Mettre temporairement de côté des modifications |
