"use client";

import { useActionState } from "react";
import { masquerSuggestion, retablirSuggestion, supprimerSuggestion } from "@/app/actions";
import { Icone } from "@/components/icone";

type Props = { id: number; masquee: boolean; motif: string | null };

/** Actions de modération sur une idée. Affiché uniquement aux personnes autorisées ; droits revérifiés côté serveur. */
export function PanneauModeration({ id, masquee, motif }: Props) {
  const [etatMasquage, masquer, masquageEnCours] = useActionState(masquerSuggestion, {});
  const [etatSuppression, supprimer, suppressionEnCours] = useActionState(supprimerSuggestion, {});

  return (
    <section
      aria-labelledby="titre-moderation"
      className="mt-[18px] flex flex-col gap-3 rounded-[20px] border-[1.5px] border-[#e8b9ab] bg-carte p-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-tomate-fonce">
          <Icone nom="bouclier" taille={20} />
        </span>
        <h2 id="titre-moderation" className="titre-bloc">
          Modération
        </h2>
      </div>

      {masquee ? (
        <>
          <p className="text-sm leading-[1.45] text-gris">
            Elle n&apos;apparaît plus dans le fil, la carte ni les chiffres.
            {motif && <> Motif : « {motif} ».</>}
          </p>
          <form action={retablirSuggestion}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="bouton-plein h-12 w-full text-[15px]">
              <Icone nom="voir" taille={18} />
              Rétablir l&apos;idée
            </button>
          </form>
        </>
      ) : (
        <form action={masquer} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={id} />
          <label htmlFor="motif" className="text-sm font-bold">
            Motif du masquage <span className="font-medium text-gris">(obligatoire)</span>
          </label>
          <input
            id="motif"
            name="motif"
            required
            minLength={3}
            maxLength={300}
            placeholder="Ex. : doublon de l'idée n° 4"
            className="champ"
            aria-invalid={Boolean(etatMasquage.erreur)}
            aria-describedby={etatMasquage.erreur ? "erreur-motif" : undefined}
          />
          {etatMasquage.erreur && (
            <p id="erreur-motif" className="erreur">
              {etatMasquage.erreur}
            </p>
          )}
          <button type="submit" disabled={masquageEnCours} className="bouton-contour h-12 text-[15px]">
            <Icone nom="masquer" taille={18} />
            {masquageEnCours ? "Masquage…" : "Masquer l'idée"}
          </button>
        </form>
      )}

      <details className="group border-t border-sable-clair pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[15px] font-bold text-tomate-fonce [&::-webkit-details-marker]:hidden">
          <Icone nom="poubelle" taille={18} />
          Supprimer définitivement…
          <Icone nom="bas" taille={16} className="ml-auto transition-transform group-open:rotate-180" />
        </summary>
        <form action={supprimer} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <div className="flex items-start gap-2">
            <input id="confirmation" name="confirmation" type="checkbox" value="oui" required className="mt-1 size-4" />
            <label htmlFor="confirmation" className="text-sm">
              Je confirme la suppression définitive de l&apos;idée, de ses votes et de ses documents.
            </label>
          </div>
          {etatSuppression.erreur && <p className="erreur">{etatSuppression.erreur}</p>}
          <button
            type="submit"
            disabled={suppressionEnCours}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-tomate bg-carte px-5 text-[15px] font-bold text-tomate-fonce hover:bg-tomate-clair disabled:opacity-60"
          >
            {suppressionEnCours ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </form>
      </details>
    </section>
  );
}
