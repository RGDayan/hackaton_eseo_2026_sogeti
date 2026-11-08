"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { Icone } from "@/components/icone";

/**
 * État d'une rangée défilante horizontale : début ou fin atteints, et défilement d'environ un écran.
 * Sert aux flèches Précédent / Suivant, pour ne dépendre ni du geste ni de la barre de défilement.
 */
export function useDefilement<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  debut: boolean;
  fin: boolean;
  surDefilement: () => void;
  defiler: (sens: 1 | -1) => void;
} {
  const ref = useRef<T>(null);
  const [debut, setDebut] = useState(true);
  const [fin, setFin] = useState(true);

  const surDefilement = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setDebut(el.scrollLeft <= 4);
    setFin(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    surDefilement();
    const observateur = new ResizeObserver(surDefilement);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, [surDefilement]);

  const defiler = useCallback((sens: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sens * el.clientWidth * 0.85, behavior: reduit ? "auto" : "smooth" });
  }, []);

  return { ref, debut, fin, surDefilement, defiler };
}

type PropsFleche = {
  sens: 1 | -1;
  libelle: string;
  desactivee: boolean;
  onClick: () => void;
  taille?: "normale" | "petite";
};

/** Flèche de défilement : grisée (et inactive) quand l'extrémité est atteinte. */
export function Fleche({ sens, libelle, desactivee, onClick, taille = "normale" }: PropsFleche) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivee}
      aria-label={libelle}
      className={`flex shrink-0 items-center justify-center rounded-full border border-trait bg-carte text-encre shadow-[0_2px_8px_rgb(28_43_36/0.08)] transition-colors hover:border-foret disabled:cursor-default disabled:opacity-40 disabled:hover:border-trait ${
        taille === "petite" ? "size-10" : "size-11"
      }`}
    >
      <Icone nom={sens === 1 ? "droite" : "gauche"} taille={taille === "petite" ? 18 : 20} />
    </button>
  );
}

type Props = {
  /** Nom accessible de la liste (« Idées les plus soutenues »). */
  libelle: string;
  /** Éléments <li> du carrousel. */
  children: ReactNode;
};

/** Carrousel avec flèches Précédent / Suivant, masquées quand tout tient à l'écran. */
export function Carrousel({ libelle, children }: Props) {
  const { ref, debut, fin, surDefilement, defiler } = useDefilement<HTMLOListElement>();

  return (
    <div>
      <ol
        ref={ref}
        aria-label={libelle}
        onScroll={surDefilement}
        className="defilement-x -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-0.5 pb-2.5 sm:mx-0 sm:scroll-px-0 sm:px-0 lg:gap-4"
      >
        {children}
      </ol>
      {!(debut && fin) && (
        <div className="mt-1 flex justify-end gap-2">
          <Fleche sens={-1} libelle="Idées précédentes" desactivee={debut} onClick={() => defiler(-1)} />
          <Fleche sens={1} libelle="Idées suivantes" desactivee={fin} onClick={() => defiler(1)} />
        </div>
      )}
    </div>
  );
}
