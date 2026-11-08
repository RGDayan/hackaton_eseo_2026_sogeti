"use client";

import { useState, useTransition } from "react";
import { supprimerCommentaire } from "@/app/actions";
import { Icone } from "@/components/icone";

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
    <span className="-mb-1.5 -ml-1.5 flex items-center gap-2">
      <button
        type="button"
        onClick={cliquer}
        disabled={enCours}
        className="flex min-h-9 items-center gap-1 px-1.5 text-[13px] font-semibold text-tomate-fonce hover:underline disabled:opacity-50"
      >
        <Icone nom="poubelle" taille={14} />
        {enCours ? "Suppression…" : "Supprimer"}
      </button>
      {echec && (
        <span role="alert" className="text-xs font-semibold text-tomate">
          Suppression impossible.
        </span>
      )}
    </span>
  );
}
