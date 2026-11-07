"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirFavori } from "@/app/actions";

type Props = {
  suggestionId: number;
  estFavori: boolean;
  connecte: boolean;
};

export function Favori({ suggestionId, estFavori, connecte }: Props) {
  const router = useRouter();
  const [actif, changerOptimiste] = useOptimistic(estFavori, (_ancien, suivant: boolean) => suivant);
  const [, demarrer] = useTransition();
  const [echec, setEchec] = useState(false);

  function allerConnexion() {
    const retour = window.location.pathname + window.location.search;
    router.push(`/connexion?next=${encodeURIComponent(retour)}`);
  }

  function cliquer() {
    if (!connecte) return allerConnexion();
    setEchec(false);
    demarrer(async () => {
      const suivant = !actif;
      changerOptimiste(suivant);
      const { statut } = await definirFavori(suggestionId, suivant);
      if (statut === "non-connecte") allerConnexion();
      if (statut === "erreur") setEchec(true);
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        aria-pressed={actif}
        aria-label={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={cliquer}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
          actif ? "border-foret bg-foret/10 text-foret" : "border-trait text-encre hover:border-foret"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={actif ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
        </svg>
        {actif ? "Favori" : "Ajouter"}
      </button>
      {echec && <p className="erreur">Action impossible. Réessayez.</p>}
    </div>
  );
}
