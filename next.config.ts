import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image Docker minimale : .next/standalone contient server.js et les seules dépendances utiles.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // Les favoris vivent désormais dans Mon espace.
    return [{ source: "/favoris", destination: "/moi?onglet=favoris", permanent: false }];
  },
  experimental: {
    serverActions: {
      // 3 fichiers de 5 Mo maximum, plus le reste du formulaire.
      bodySizeLimit: "16mb",
    },
  },
  turbopack: {
    // Un autre lockfile existe dans un dossier parent : on fixe la racine sur ce projet.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
