"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { voter } from "@/app/actions";
import { useFeuilleCompte } from "@/components/feuille-compte";
import { Icone } from "@/components/icone";
import { pourcentagePour } from "@/lib/format";

type Etat = { pour: number; contre: number; monVote: number };

function appliquerVote(etat: Etat, valeur: 1 | -1): Etat {
  let { pour, contre } = etat;
  if (etat.monVote === 1) pour--;
  if (etat.monVote === -1) contre--;
  if (etat.monVote === valeur) return { pour, contre, monVote: 0 };
  if (valeur === 1) pour++;
  else contre++;
  return { pour, contre, monVote: valeur };
}

type PropsVote = {
  suggestionId: number;
  pour: number;
  contre: number;
  monVote: number;
  connecte: boolean;
};

/** Vote optimiste : l'affichage suit le clic, le serveur confirme ensuite. Un visiteur voit la feuille de compte. */
function useVote({ suggestionId, pour, contre, monVote, connecte }: PropsVote) {
  const router = useRouter();
  const ouvrirFeuille = useFeuilleCompte();
  const [etat, voterOptimiste] = useOptimistic({ pour, contre, monVote }, appliquerVote);
  const [, demarrer] = useTransition();
  const [echec, setEchec] = useState(false);
  // Petit rebond du bouton « Pour » à chaque soutien (désactivé par prefers-reduced-motion, voir globals.css).
  const [rebond, setRebond] = useState(false);

  function cliquer(valeur: 1 | -1, apres?: (suivant: number) => void) {
    if (!connecte) return ouvrirFeuille();
    setEchec(false);
    const suivant = etat.monVote === valeur ? 0 : valeur;
    if (suivant === 1) setRebond(true);
    apres?.(suivant);
    demarrer(async () => {
      voterOptimiste(valeur);
      const { statut } = await voter(suggestionId, valeur);
      if (statut === "non-connecte") router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      if (statut === "erreur") setEchec(true);
    });
  }

  return { etat, cliquer, echec, rebond, finRebond: () => setRebond(false), pct: pourcentagePour(etat.pour, etat.contre) };
}

const classeBouton = "inline-flex items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap transition-colors";

function stylePour(actif: boolean, fort = false) {
  if (actif) return "border-foret bg-foret text-white";
  return fort ? "border-foret bg-carte text-foret-fonce hover:bg-foret/8" : "border-trait bg-carte text-encre hover:border-foret";
}

/** « Contre » s'affiche en encre : la tomate reste réservée aux erreurs. */
function styleContre(actif: boolean) {
  return actif ? "border-encre bg-encre text-white" : "border-trait bg-carte text-encre hover:border-encre";
}

/** Vote dans une carte du fil : jauge de soutien, puis boutons Pour / Contre et actions secondaires. */
export function Vote(props: PropsVote & { children?: ReactNode }) {
  const { etat, cliquer, echec, rebond, finRebond, pct } = useVote(props);

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <div className="mb-1.5 flex justify-between gap-2 text-[13px]">
          <span>
            <strong className="font-bold tabular-nums">{etat.pour}</strong>{" "}
            <span className="text-gris">{etat.pour > 1 ? "voisins soutiennent" : "voisin soutient"}</span>
          </span>
          <span className="text-gris">{etat.pour + etat.contre === 0 ? "Pas encore de vote" : `${pct} % pour`}</span>
        </div>
        <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-sable">
          <div className="h-full rounded-full bg-foret transition-[width] duration-400" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="-mx-1 flex items-center gap-1.5">
        <button
          type="button"
          onAnimationEnd={finRebond}
          aria-pressed={etat.monVote === 1}
          onClick={() => cliquer(1)}
          className={`${classeBouton} h-11 px-3.5 text-sm ${stylePour(etat.monVote === 1)} ${rebond ? "pop" : ""}`}
        >
          <Icone nom="pour" taille={17} />
          Pour <span className="tabular-nums">{etat.pour}</span>
        </button>
        <button
          type="button"
          aria-pressed={etat.monVote === -1}
          onClick={() => cliquer(-1)}
          className={`${classeBouton} h-11 px-3.5 text-sm ${styleContre(etat.monVote === -1)}`}
        >
          <Icone nom="contre" taille={17} />
          <span className="sr-only">Contre</span>
          <span className="tabular-nums">{etat.contre}</span>
        </button>
        {props.children}
      </div>
      {echec && <p className="erreur">Votre vote n&apos;a pas été enregistré. Réessayez.</p>}
    </div>
  );
}

type PropsAvis = PropsVote & {
  /** Favori et partage, affichés dans la barre d'action. */
  actions: ReactNode;
};

/**
 * Avis sur la fiche idée : synthèse des votes, puis barre d'action Pour · Contre · Favori · Partager.
 * Sur mobile, la barre est fixée en bas de l'écran ; sur grand écran, elle reste dans le bloc.
 */
export function AvisIdee({ actions, ...props }: PropsAvis) {
  const { etat, cliquer, echec, rebond, finRebond, pct } = useVote(props);
  const [toast, setToast] = useState(false);
  const total = etat.pour + etat.contre;

  function voterAvecToast(valeur: 1 | -1) {
    cliquer(valeur, (suivant) => {
      setToast(suivant === 1);
      if (suivant === 1) window.setTimeout(() => setToast(false), 4000);
    });
  }

  return (
    <>
      <section aria-labelledby="titre-avis" className="carte rounded-[20px] p-4">
        <h2 id="titre-avis" className="titre-bloc">
          <span className="tabular-nums">{etat.pour}</span>{" "}
          {etat.pour > 1 ? "voisins soutiennent" : "voisin soutient"} cette idée
        </h2>
        <div aria-hidden className="mt-3.5 mb-2 flex h-3 gap-0.5 overflow-hidden rounded-full bg-sable">
          {total > 0 && (
            <>
              <span className="rounded-full bg-foret transition-[width] duration-400" style={{ width: `${pct}%` }} />
              <span className="flex-1 rounded-full bg-[repeating-linear-gradient(135deg,#bdb3a0_0_3px,#ece4d3_3px_6px)]" />
            </>
          )}
        </div>
        <div className="flex justify-between gap-2 text-[13.5px]">
          <span>
            <strong className="text-foret-fonce">{pct} % pour</strong> <span className="text-gris">({etat.pour})</span>
          </span>
          <span className="text-gris">
            {etat.contre} contre · {total} vote{total > 1 ? "s" : ""}
          </span>
        </div>
        {etat.monVote !== 0 && (
          <p className="mt-3 flex items-center gap-2 border-t border-sable-clair pt-1 text-[13.5px] font-semibold text-foret-fonce">
            <Icone nom="valider" taille={16} epaisseur={2.6} />
            {etat.monVote === 1 ? "Vous soutenez cette idée" : "Vous avez voté contre"}
            <button
              type="button"
              onClick={() => voterAvecToast(etat.monVote as 1 | -1)}
              className="ml-auto min-h-11 text-encre underline"
            >
              Annuler
            </button>
          </p>
        )}
        {echec && <p className="erreur">Votre vote n&apos;a pas été enregistré. Réessayez.</p>}

        {/* Barre d'action : fixée en bas sur mobile, intégrée au bloc sur grand écran. */}
        <div
          role="toolbar"
          aria-label="Réagir à l'idée"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-trait bg-carte px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),14px)] shadow-[0_-6px_20px_rgb(28_43_36/0.07)] lg:static lg:mt-4 lg:border-0 lg:p-0 lg:shadow-none"
        >
          <button
            type="button"
            onAnimationEnd={finRebond}
            aria-pressed={etat.monVote === 1}
            onClick={() => voterAvecToast(1)}
            className={`${classeBouton} h-[50px] flex-1 border-[1.5px] px-4 text-base ${stylePour(etat.monVote === 1, true)} ${rebond ? "pop" : ""}`}
          >
            <Icone nom="pour" taille={20} />
            Pour <span className="tabular-nums">{etat.pour}</span>
          </button>
          <button
            type="button"
            aria-pressed={etat.monVote === -1}
            onClick={() => voterAvecToast(-1)}
            className={`${classeBouton} h-[50px] border-[1.5px] px-4 text-base ${styleContre(etat.monVote === -1)}`}
          >
            <Icone nom="contre" taille={20} />
            <span className="tabular-nums">{etat.contre}</span>
            <span className="sr-only">Contre</span>
          </button>
          {actions}
        </div>
      </section>

      <div aria-live="polite" className="fixed inset-x-4 bottom-[100px] z-40 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96">
        {toast && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-encre px-3.5 py-3 text-[14.5px] text-white shadow-[0_8px_24px_rgb(0_0_0/0.25)]">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soleil text-encre">
              <Icone nom="valider" taille={16} epaisseur={3} />
            </span>
            <span className="flex-1">Merci ! Votre soutien est enregistré.</span>
            <button type="button" onClick={() => voterAvecToast(1)} className="min-h-11 font-bold underline">
              Annuler
            </button>
          </div>
        )}
      </div>
    </>
  );
}
