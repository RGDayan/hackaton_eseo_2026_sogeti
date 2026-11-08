"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { voter } from "@/app/actions";
import { useFeuilleCompte } from "@/components/feuille-compte";
import { Icone } from "@/components/icone";

/** Il n'y a pas de vote « contre » : un vote est un soutien, qu'un second clic retire. */
type Etat = { pour: number; soutenu: boolean };

// Le second paramètre (l'action) est inutile : chaque clic bascule le soutien.
function basculer(etat: Etat): Etat {
  return etat.soutenu ? { pour: etat.pour - 1, soutenu: false } : { pour: etat.pour + 1, soutenu: true };
}

type PropsVote = {
  suggestionId: number;
  pour: number;
  /** Vote de l'habitant connecté : 1 s'il soutient l'idée, 0 sinon. */
  monVote: number;
  connecte: boolean;
};

/** Soutien optimiste : l'affichage suit le clic, le serveur confirme ensuite. Un visiteur voit la feuille de compte. */
function useSoutien({ suggestionId, pour, monVote, connecte }: PropsVote) {
  const router = useRouter();
  const ouvrirFeuille = useFeuilleCompte();
  const [etat, basculerOptimiste] = useOptimistic({ pour, soutenu: monVote === 1 }, basculer);
  const [, demarrer] = useTransition();
  const [echec, setEchec] = useState(false);
  // Petit rebond du bouton à chaque soutien (désactivé par prefers-reduced-motion, voir globals.css).
  const [rebond, setRebond] = useState(false);

  function cliquer(apres?: (soutenu: boolean) => void) {
    if (!connecte) return ouvrirFeuille();
    setEchec(false);
    const suivant = !etat.soutenu;
    if (suivant) setRebond(true);
    apres?.(suivant);
    demarrer(async () => {
      basculerOptimiste(null);
      const { statut } = await voter(suggestionId);
      if (statut === "non-connecte") router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      if (statut === "erreur") setEchec(true);
    });
  }

  return { etat, cliquer, echec, rebond, finRebond: () => setRebond(false) };
}

const classeBouton =
  "inline-flex items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap transition-colors";

function styleSoutien(actif: boolean, fort = false) {
  if (actif) return "border-foret bg-foret text-white";
  return fort
    ? "border-foret bg-carte text-foret-fonce hover:bg-foret/8"
    : "border-trait bg-carte text-encre hover:border-foret";
}

const libelleSoutiens = (n: number) => (n > 1 ? "voisins soutiennent" : "voisin soutient");

/** Soutien dans une carte du fil : bouton « Je soutiens N », puis actions secondaires. */
export function Vote(props: PropsVote & { children?: ReactNode }) {
  const { etat, cliquer, echec, rebond, finRebond } = useSoutien(props);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="-mx-1 flex items-center gap-1.5">
        <button
          type="button"
          onAnimationEnd={finRebond}
          aria-pressed={etat.soutenu}
          onClick={() => cliquer()}
          className={`${classeBouton} h-11 px-3.5 text-sm ${styleSoutien(etat.soutenu)} ${rebond ? "pop" : ""}`}
        >
          <Icone nom="pour" taille={17} />
          Je soutiens <span className="tabular-nums">{etat.pour}</span>
        </button>
        {props.children}
      </div>
      {echec && <p className="erreur">Votre soutien n&apos;a pas été enregistré. Réessayez.</p>}
    </div>
  );
}

type PropsAvis = PropsVote & {
  /** Favori et partage, affichés dans la barre d'action. */
  actions: ReactNode;
};

/**
 * Soutiens sur la fiche idée, puis barre d'action Je soutiens · Favori · Partager.
 * Sur mobile, la barre est fixée en bas de l'écran ; sur grand écran, elle reste dans le bloc.
 */
export function AvisIdee({ actions, ...props }: PropsAvis) {
  const { etat, cliquer, echec, rebond, finRebond } = useSoutien(props);
  const [toast, setToast] = useState(false);

  function soutenirAvecToast() {
    cliquer((soutenu) => {
      setToast(soutenu);
      if (soutenu) window.setTimeout(() => setToast(false), 4000);
    });
  }

  return (
    <>
      <section aria-labelledby="titre-avis" className="carte rounded-[20px] p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-foret/12 text-foret-fonce">
            <Icone nom="pour" taille={22} />
          </span>
          <h2 id="titre-avis" className="titre-bloc">
            <span className="tabular-nums">{etat.pour}</span> {libelleSoutiens(etat.pour)} cette idée
          </h2>
        </div>
        {etat.soutenu && (
          <p className="mt-3 flex items-center gap-2 border-t border-sable-clair pt-1 text-[13.5px] font-semibold text-foret-fonce">
            <Icone nom="valider" taille={16} epaisseur={2.6} />
            Vous soutenez cette idée
            <button type="button" onClick={soutenirAvecToast} className="ml-auto min-h-11 text-encre underline">
              Retirer mon soutien
            </button>
          </p>
        )}
        {echec && <p className="erreur">Votre soutien n&apos;a pas été enregistré. Réessayez.</p>}

        {/* Barre d'action : fixée en bas sur mobile, intégrée au bloc sur grand écran. */}
        <div
          role="toolbar"
          aria-label="Réagir à l'idée"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-trait bg-carte px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),14px)] shadow-[0_-6px_20px_rgb(28_43_36/0.07)] lg:static lg:mt-4 lg:border-0 lg:p-0 lg:shadow-none"
        >
          <button
            type="button"
            onAnimationEnd={finRebond}
            aria-pressed={etat.soutenu}
            onClick={soutenirAvecToast}
            className={`${classeBouton} h-[50px] flex-1 border-[1.5px] px-4 text-base ${styleSoutien(etat.soutenu, true)} ${rebond ? "pop" : ""}`}
          >
            <Icone nom="pour" taille={20} />
            Je soutiens <span className="tabular-nums">{etat.pour}</span>
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
            <button type="button" onClick={soutenirAvecToast} className="min-h-11 font-bold underline">
              Annuler
            </button>
          </div>
        )}
      </div>
    </>
  );
}
