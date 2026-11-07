"use client";

import { useActionState } from "react";
import { masquerSuggestion, retablirSuggestion, supprimerSuggestion } from "@/app/actions";

type Props = { id: number; masquee: boolean; motif: string | null };

/** Actions de modération sur une idée. Affiché uniquement aux personnes autorisées ; droits revérifiés côté serveur. */
export function PanneauModeration({ id, masquee, motif }: Props) {
  const [etatMasquage, masquer, masquageEnCours] = useActionState(masquerSuggestion, {});
  const [etatSuppression, supprimer, suppressionEnCours] = useActionState(supprimerSuggestion, {});

  return (
    <section aria-labelledby="titre-moderation" className="mt-8 rounded-2xl border border-tomate/40 bg-carte p-5">
      <h2 id="titre-moderation" className="font-titre text-lg font-semibold">
        Modération
      </h2>

      {masquee ? (
        <div className="mt-3">
          <p className="text-sm">
            <strong>Idée masquée</strong> : elle n&apos;apparaît plus dans le fil, la carte ni les chiffres.
            {motif && <> Motif : « {motif} ».</>}
          </p>
          <form action={retablirSuggestion} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="bouton-plein">
              Rétablir l&apos;idée
            </button>
          </form>
        </div>
      ) : (
        <form action={masquer} className="mt-3">
          <input type="hidden" name="id" value={id} />
          <label htmlFor="motif" className="libelle">
            Motif du masquage
          </label>
          <input
            id="motif"
            name="motif"
            required
            minLength={3}
            maxLength={300}
            className="champ"
            aria-invalid={Boolean(etatMasquage.erreur)}
            aria-describedby={etatMasquage.erreur ? "erreur-motif" : undefined}
          />
          {etatMasquage.erreur && (
            <p id="erreur-motif" className="erreur">
              {etatMasquage.erreur}
            </p>
          )}
          <button type="submit" disabled={masquageEnCours} className="bouton-contour mt-3">
            {masquageEnCours ? "Masquage…" : "Masquer l'idée"}
          </button>
        </form>
      )}

      <form action={supprimer} className="mt-6 border-t border-trait pt-4">
        <input type="hidden" name="id" value={id} />
        <div className="flex items-start gap-2">
          <input id="confirmation" name="confirmation" type="checkbox" value="oui" required className="mt-1" />
          <label htmlFor="confirmation" className="text-sm">
            Je confirme la suppression définitive de l&apos;idée, de ses votes et de ses documents.
          </label>
        </div>
        {etatSuppression.erreur && <p className="erreur">{etatSuppression.erreur}</p>}
        <button
          type="submit"
          disabled={suppressionEnCours}
          className="mt-3 rounded-full bg-tomate px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {suppressionEnCours ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </form>
    </section>
  );
}
