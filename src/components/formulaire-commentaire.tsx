"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterCommentaire } from "@/app/actions";
import { COMMENTAIRE_MAX } from "@/lib/validation";

export function FormulaireCommentaire({ suggestionId }: { suggestionId: number }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    demarrer(async () => {
      const resultat = await ajouterCommentaire(suggestionId, texte);
      if (resultat.statut === "ok") {
        setTexte("");
      } else if (resultat.statut === "non-connecte") {
        router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      } else {
        setErreur(resultat.message ?? "Votre commentaire n'a pas pu être publié. Réessayez.");
      }
    });
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-2">
      <label htmlFor="commentaire" className="text-sm font-bold">
        Votre commentaire
      </label>
      <textarea
        id="commentaire"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        maxLength={COMMENTAIRE_MAX}
        rows={3}
        placeholder="Partagez votre avis, une précision, une expérience…"
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur ? "erreur-commentaire" : undefined}
        className="champ resize-none rounded-2xl text-[15px] leading-[1.45]"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gris tabular-nums">
          {texte.length} / {COMMENTAIRE_MAX}
        </span>
        <button type="submit" disabled={enCours || texte.trim().length === 0} className="bouton-plein disabled:opacity-50">
          {enCours ? "Publication…" : "Publier"}
        </button>
      </div>
      {erreur && (
        <p id="erreur-commentaire" role="alert" className="erreur">
          {erreur}
        </p>
      )}
    </form>
  );
}
