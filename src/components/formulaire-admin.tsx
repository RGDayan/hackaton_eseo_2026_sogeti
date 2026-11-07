"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { EtatAdmin } from "@/lib/validation";

type Props = {
  action: (etat: EtatAdmin, formData: FormData) => Promise<EtatAdmin>;
  bouton: string;
  variante?: "plein" | "contour" | "danger";
  className?: string;
  children: ReactNode;
};

const STYLES = {
  plein: "bouton-plein",
  contour: "bouton-contour",
  danger: "rounded-full px-4 py-2 text-sm font-semibold text-tomate hover:bg-tomate/10",
};

/** Formulaire d'administration : champs fournis par la page, retour de l'action annoncé aux lecteurs d'écran. */
export function FormulaireAdmin({ action, bouton, variante = "plein", className = "", children }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enCours} className={`${STYLES[variante]} disabled:opacity-60`}>
          {enCours ? "Enregistrement…" : bouton}
        </button>
        <p aria-live="polite" className="text-sm">
          {etat.erreur && <span className="text-tomate">{etat.erreur}</span>}
          {etat.ok && <span className="text-foret">{etat.ok}</span>}
        </p>
      </div>
    </form>
  );
}
