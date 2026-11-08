"use client";

import { PageSysteme } from "@/components/page-systeme";

export default function Erreur({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <PageSysteme
      grand="Oups"
      titre="Quelque chose s'est mal passé"
      texte="Ce n'est pas de votre fait. Réessayez dans un instant : vos votes sont conservés."
      reessayer={retry}
      actions={[{ href: "/", libelle: "Retour à l'accueil" }]}
      reference={error.digest}
    />
  );
}
