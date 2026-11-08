"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirFavori } from "@/app/actions";
import { useFeuilleCompte } from "@/components/feuille-compte";
import { Icone } from "@/components/icone";

type Props = {
  suggestionId: number;
  estFavori: boolean;
  /** Nombre total d'habitants qui ont mis l'idée en favori (le vôtre compris). */
  nombre: number;
  connecte: boolean;
  /** « icone » dans les cartes du fil, « rond » dans la barre d'action de la fiche. */
  variante?: "icone" | "rond";
};

export function Favori({ suggestionId, estFavori, nombre, connecte, variante = "icone" }: Props) {
  const router = useRouter();
  const ouvrirFeuille = useFeuilleCompte();
  const [actif, changerOptimiste] = useOptimistic(estFavori, (_ancien, suivant: boolean) => suivant);
  const [, demarrer] = useTransition();
  // Le compteur suit le clic tout de suite : +1 si on vient d'ajouter, -1 si on vient de retirer.
  const affiche = Math.max(0, nombre + (actif ? 1 : 0) - (estFavori ? 1 : 0));
  const [echec, setEchec] = useState(false);

  function cliquer() {
    if (!connecte) return ouvrirFeuille();
    setEchec(false);
    demarrer(async () => {
      const suivant = !actif;
      changerOptimiste(suivant);
      const { statut } = await definirFavori(suggestionId, suivant);
      if (statut === "non-connecte") router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      if (statut === "erreur") setEchec(true);
    });
  }

  const libelle = `${actif ? "Retirer des favoris" : "Ajouter aux favoris"} (${affiche} favori${affiche > 1 ? "s" : ""})`;
  const forme =
    variante === "rond"
      ? "size-[50px] border-[1.5px] border-trait bg-carte"
      : "size-11 hover:bg-sable/70";

  return (
    <span className="relative flex">
      <button
        type="button"
        aria-pressed={actif}
        aria-label={libelle}
        title={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={cliquer}
        className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${forme} ${
          actif ? "text-tomate" : variante === "rond" ? "text-encre" : "text-gris"
        }`}
      >
        <Icone nom="coeur" taille={variante === "rond" ? 21 : 20} plein={actif} />
      </button>
      {echec && (
        <span role="alert" className="absolute top-full right-0 mt-1 text-xs font-semibold whitespace-nowrap text-tomate">
          Action impossible.
        </span>
      )}
    </span>
  );
}

/** Partage natif du lien de l'idée, ou copie dans le presse-papiers à défaut. */
export function Partager({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, url });
      } catch {
        // Partage annulé : rien à faire.
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopie(true);
    window.setTimeout(() => setCopie(false), 2500);
  }

  return (
    <span className="relative flex">
      <button
        type="button"
        onClick={partager}
        aria-label="Partager"
        className="flex size-[50px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-trait bg-carte"
      >
        <Icone nom={copie ? "valider" : "partager"} taille={20} />
      </button>
      <span aria-live="polite" className="sr-only">
        {copie ? "Lien copié" : ""}
      </span>
    </span>
  );
}
