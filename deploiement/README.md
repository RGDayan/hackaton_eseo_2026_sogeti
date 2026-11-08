# Déploiement de Quartea

Toute la stack tourne sur un seul serveur avec Docker Compose, derrière une seule URL publique en HTTPS :

| URL | Service |
|---|---|
| `https://<DOMAINE>/` | Application Next.js |
| `https://<DOMAINE>/kc/` | Keycloak (connexion, inscription) |
| `https://<DOMAINE>/kc/admin/` | Console d'administration Keycloak (identifiant `admin`) |

Keycloak est sous `/kc` et non sous `/auth`, parce que `/auth/login`, `/auth/callback` et `/auth/logout` sont des routes de l'application.

Services : `caddy` (reverse proxy et certificat Let's Encrypt automatique), `app`, `migrations` (migrations et seed, puis arrêt), `postgres`, `keycloak` et `keycloak-db`. Seuls les ports 80 et 443 sont ouverts.

## Prérequis

- Un serveur Linux avec **2 Go de RAM minimum** (4 Go conseillés). Keycloak consomme environ 700 Mo, le reste environ 200 Mo.
- **Docker** avec le plugin Compose : `curl -fsSL https://get.docker.com | sh`.
- Les **ports 80 et 443** joignables depuis Internet. Let's Encrypt valide le certificat par le port 80.
- **Pas besoin de nom de domaine** : [sslip.io](https://sslip.io) fait pointer `51-75-10-20.sslip.io` vers l'IP `51.75.10.20`, sans inscription.

### Oracle Cloud (Always Free)

1. Créez une instance **VM.Standard.A1.Flex** (ARM), par exemple 2 OCPU et 12 Go, sous **Ubuntu 24.04**. Si le message « Out of capacity » apparaît, essayez un autre domaine de disponibilité ou réessayez plus tard.
2. **Réseau VCN**, puis la *Security List* du sous-réseau : ajoutez des règles d'entrée TCP pour les ports 80 et 443, source `0.0.0.0/0`.
3. **Pare-feu de l'instance** : les images Ubuntu d'Oracle bloquent tout sauf SSH via iptables.
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
   Si vous oubliez ces étapes, Caddy n'obtient pas de certificat et le site ne répond pas.

L'image se construit directement sur la VM ARM, sans réglage particulier.

### VPS OVH

- Vérifiez que rien n'écoute déjà sur les ports 80 et 443 (`sudo ss -ltnp | grep -E ':(80|443) '`). S'il y a déjà un Nginx ou un Apache, arrêtez-le, ou faites-le pointer vers Caddy à la place.
- Si le pare-feu `ufw` est actif : `sudo ufw allow 80,443/tcp && sudo ufw allow 443/udp`.
- Vous pouvez utiliser l'IP du VPS avec sslip.io, ou un sous-domaine à vous, avec un enregistrement DNS A vers le VPS.

## Première mise en route

```bash
git clone https://github.com/RGDayan/hackaton_eseo_2026_sogeti.git place-commune
cd place-commune/deploiement
cp .env.example .env
nano .env
```

Dans `.env`, renseignez :
- `DOMAINE` : l'IP publique avec des tirets à la place des points, puis `.sslip.io` (`curl -4 ifconfig.me` donne l'IP) ;
- chaque secret, généré avec `openssl rand -hex 32` ;
- `MDP_COMPTES_DEMO` : un mot de passe propre à la prod pour les 4 comptes de démo.

> **Fixez `DOMAINE` avant le premier lancement.** Keycloak n'importe le realm (URL de redirection, secret client, mots de passe de démo) qu'au premier démarrage. Pour changer ces valeurs ensuite, voir la section Maintenance.

```bash
docker compose up -d --build
docker compose logs -f migrations keycloak caddy   # Ctrl+C pour quitter
```

Le premier build prend quelques minutes. Keycloak met ensuite 40 à 60 secondes à démarrer. Le site est prêt quand `https://<DOMAINE>/` s'affiche avec un cadenas valide.

## Vérifications avant la démo

- [ ] `https://<DOMAINE>/` s'affiche, avec un certificat valide.
- [ ] « Se connecter » ouvre la page Keycloak aux couleurs de la ville.
- [ ] Connexion avec `habitant.demo` : proposer une idée avec une pièce jointe, puis voter.
- [ ] « Créer un compte » fonctionne, c'est ce que fera le jury.
- [ ] Connexion avec `moderateur.dijon` : masquer puis rétablir une idée.
- [ ] La déconnexion ramène à l'accueil.
- [ ] Le QR code ouvre bien le site depuis un téléphone en 4G, hors du Wi-Fi.

QR code (sans service en ligne) : `qrencode -o qr.png -s 12 "https://<DOMAINE>/"` (paquet `qrencode`).

## Maintenance

| Besoin | Commande (dans `deploiement/`) |
|---|---|
| Mettre à jour après un `git pull` | `docker compose up -d --build` |
| Voir les logs | `docker compose logs -f app` (ou `keycloak`, `caddy`) |
| État des services | `docker compose ps` |
| Rejouer le seed (idées de démo) | `docker compose run --rm migrations` |
| Arrêter | `docker compose down` (les données sont conservées) |
| **Tout effacer** (bases, comptes, fichiers joints, certificats) | `docker compose down -v` |

**Changer le domaine ou réimporter le realm** : le plus simple est `docker compose down -v`, puis `up -d --build`. Attention, les comptes créés et les idées sont perdus. Pour garder les données, modifiez plutôt le client `place-commune-web` dans la console Keycloak : *Valid redirect URIs*, *Web origins* et *Valid post logout redirect URIs*.

**Les droits de modération** se gèrent dans la console Keycloak, avec les groupes `/villes/<slug>/moderateurs` et le rôle `super-admin`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Le site ne répond pas, ou pas de certificat (`docker compose logs caddy`) | Ports 80 et 443 fermés (Security List ou iptables sur Oracle, `ufw` sur OVH), ou `DOMAINE` qui ne correspond pas à l'IP |
| Erreur Let's Encrypt « too many certificates » | Limite de certificats atteinte pour sslip.io. Essayez `<ip-avec-tirets>.nip.io` dans `DOMAINE` (nip.io fonctionne pareil), ou un sous-domaine gratuit DuckDNS |
| « Keycloak indisponible » sur la page de connexion | Keycloak démarre encore (attendez une minute), ou `docker compose logs keycloak` |
| « Invalid redirect uri » chez Keycloak | Realm importé avec un autre `DOMAINE` (voir Maintenance) |
| `app` ne démarre pas | Le service `migrations` a échoué : `docker compose logs migrations` |
