"use client";

import { useState, useTransition } from "react";
import { supprimerCommentaire } from "@/app/actions";

export function SupprimerCommentaire({ commentaireId }: { commentaireId: number }) {
  const [enCours, demarrer] = useTransition();
  const [echec, setEchec] = useState(false);

  function cliquer() {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    setEchec(false);
    demarrer(async () => {
      const { statut } = await supprimerCommentaire(commentaireId);
      if (statut !== "ok") setEchec(true);
    });
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      {echec && <span className="text-xs text-tomate">Suppression impossible.</span>}
      <button
        type="button"
        onClick={cliquer}
        disabled={enCours}
        className="text-xs text-gris hover:text-tomate hover:underline disabled:opacity-50"
      >
        {enCours ? "Suppression…" : "Supprimer"}
      </button>
    </span>
  );
}
