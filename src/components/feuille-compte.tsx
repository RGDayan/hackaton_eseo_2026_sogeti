"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/icone";

type Contexte = { ouvrir: () => void };

const FeuilleContexte = createContext<Contexte | null>(null);

/**
 * Feuille « Créez un compte en 20 secondes », ouverte quand un visiteur vote ou ajoute un favori.
 * <dialog> natif : piège le focus, se ferme avec Échap et rend le focus au bouton d'origine.
 */
export function FournisseurFeuilleCompte({ children }: { children: ReactNode }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [retour, setRetour] = useState("/");

  const ouvrir = useCallback(() => {
    setRetour(window.location.pathname + window.location.search);
    dialogue.current?.showModal();
  }, []);

  const fermer = () => dialogue.current?.close();
  const suivant = encodeURIComponent(retour);

  return (
    <FeuilleContexte.Provider value={{ ouvrir }}>
      {children}
      <dialog
        ref={dialogue}
        aria-labelledby="titre-feuille-compte"
        className="feuille bg-carte p-0 text-encre shadow-[0_-10px_30px_rgb(0_0_0/0.2)]"
        // Clic sur le fond : la cible est le <dialog> lui-même, pas son contenu.
        onClick={(e) => e.target === e.currentTarget && fermer()}
      >
        <div className="relative flex flex-col gap-3 px-5 pt-2.5 pb-8 sm:pt-6">
          <span aria-hidden className="h-[5px] w-10 self-center rounded-full bg-trait-fonce sm:hidden" />
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer"
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-sable/70"
          >
            <Icone nom="fermer" taille={20} />
          </button>
          <span
            aria-hidden
            className="mt-1.5 flex size-14 items-center justify-center rounded-[18px] bg-foret/12 text-foret-fonce"
          >
            <Icone nom="pour" taille={28} />
          </span>
          <h2 id="titre-feuille-compte" className="pr-10 font-titre text-2xl leading-tight font-semibold">
            Créez un compte en 20 secondes pour donner votre avis
          </h2>
          <p className="text-[15px] leading-normal text-gris">
            Un pseudo et un mot de passe suffisent. Pas d&apos;e-mail obligatoire, aucune donnée personnelle
            demandée.
          </p>
          <a href={`/auth/login?inscription=1&next=${suivant}`} className="bouton-plein bouton-grand mt-1.5">
            Créer un compte
          </a>
          <a href={`/connexion?next=${suivant}`} className="bouton-contour bouton-grand">
            J&apos;ai déjà un compte
          </a>
        </div>
      </dialog>
    </FeuilleContexte.Provider>
  );
}

/** Ouvre la feuille si elle est disponible, sinon envoie vers la page de connexion. */
export function useFeuilleCompte() {
  const contexte = useContext(FeuilleContexte);
  const router = useRouter();
  return useCallback(() => {
    if (contexte) return contexte.ouvrir();
    const retour = window.location.pathname + window.location.search;
    router.push(`/connexion?next=${encodeURIComponent(retour)}`);
  }, [contexte, router]);
}
