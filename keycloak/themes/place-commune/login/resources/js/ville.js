/*
 * Charte de la ville courante sur les pages Keycloak.
 *
 * L'application ajoute `ville=<slug>` à l'URL d'autorisation. La page de connexion s'affiche à cette URL :
 * on y lit la ville et l'origine de l'application (redirect_uri, déjà validée par Keycloak), puis on
 * récupère la charte via GET <app>/api/villes/<slug>/theme. Elle est gardée en sessionStorage pour les
 * pages suivantes (mauvais mot de passe, inscription…), dont l'URL ne contient plus ces paramètres.
 * Sans JavaScript, la charte par défaut de Place Commune s'applique.
 */
(function () {
  "use strict";

  var CLE = "place-commune-theme";
  var HEX = /^#[0-9a-f]{6}$/i;
  var SLUG = /^[a-z0-9-]{1,60}$/;

  function lireCache() {
    try {
      return JSON.parse(sessionStorage.getItem(CLE) || "null");
    } catch (e) {
      return null;
    }
  }

  function appliquerCouleurs(theme) {
    if (!theme) return;
    var racine = document.documentElement.style;
    [
      ["--pc-principale", theme.couleurPrincipale],
      ["--pc-principale-foncee", theme.couleurPrincipaleFoncee],
      ["--pc-accent", theme.couleurAccent],
    ].forEach(function (paire) {
      if (HEX.test(paire[1] || "")) racine.setProperty(paire[0], paire[1]);
    });
  }

  function afficherVille(theme) {
    if (!theme) return;
    var entete = document.getElementById("kc-header-wrapper");
    if (entete && theme.nom && !entete.querySelector(".pc-ville")) {
      var ville = document.createElement("span");
      ville.className = "pc-ville";
      ville.textContent = String(theme.nom).slice(0, 80);
      entete.appendChild(ville);
    }
    var carte = document.querySelector(".pf-v5-c-login__main");
    if (carte && theme.origine && !document.querySelector(".pc-retour")) {
      var retour = document.createElement("a");
      retour.className = "pc-retour";
      retour.href = theme.origine + "/";
      retour.textContent = "← Retour aux idées";
      carte.insertAdjacentElement("afterend", retour);
    }
  }

  // 1. Tout de suite (dans <head>) : couleurs mémorisées, pour éviter un flash de la charte par défaut.
  var cache = lireCache();
  appliquerCouleurs(cache);

  // 2. Une fois la page chargée : charte à jour si l'URL désigne une ville.
  document.addEventListener("DOMContentLoaded", function () {
    afficherVille(cache);

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("ville");
    var origine;
    try {
      var redirection = new URL(params.get("redirect_uri") || "");
      if (redirection.protocol === "http:" || redirection.protocol === "https:") origine = redirection.origin;
    } catch (e) {
      origine = undefined;
    }
    // Seulement sur une vraie page de formulaire : une page d'erreur peut porter une redirect_uri refusée.
    var formulaire = document.getElementById("kc-form-login") || document.getElementById("kc-register-form");
    if (!slug || !SLUG.test(slug) || !origine || !formulaire) return;

    fetch(origine + "/api/villes/" + encodeURIComponent(slug) + "/theme")
      .then(function (reponse) {
        return reponse.ok ? reponse.json() : null;
      })
      .then(function (donnees) {
        if (!donnees) return;
        var theme = {
          nom: donnees.nom,
          couleurPrincipale: donnees.couleurPrincipale,
          couleurPrincipaleFoncee: donnees.couleurPrincipaleFoncee,
          couleurAccent: donnees.couleurAccent,
          origine: origine,
        };
        sessionStorage.setItem(CLE, JSON.stringify(theme));
        appliquerCouleurs(theme);
        var ancienne = document.querySelector(".pc-ville");
        if (ancienne) ancienne.remove();
        afficherVille(theme);
      })
      .catch(function () {
        /* Application injoignable : on garde la charte par défaut. */
      });
  });
})();
