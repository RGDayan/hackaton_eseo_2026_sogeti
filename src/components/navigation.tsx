"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icone, type NomIcone } from "@/components/icone";

export type IdLien = "explorer" | "carte" | "chiffres" | "moi" | "moderation" | "admin";

type Lien = { id: IdLien; href: string; libelle: string; icone: NomIcone };

const LIENS: Record<IdLien, Lien> = {
  explorer: { id: "explorer", href: "/", libelle: "Explorer", icone: "explorer" },
  carte: { id: "carte", href: "/?vue=carte#fil", libelle: "Carte", icone: "carte" },
  chiffres: { id: "chiffres", href: "/dashboard", libelle: "Dashboard", icone: "graphique" },
  moi: { id: "moi", href: "/moi", libelle: "Mon espace", icone: "moi" },
  moderation: { id: "moderation", href: "/moderation", libelle: "Modération", icone: "bouclier" },
  admin: { id: "admin", href: "/admin", libelle: "Admin", icone: "reglages" },
};

/** Onglet de la page affichée, d'après l'URL. */
function useOngletCourant(): IdLien | "proposer" | "connexion" | null {
  const chemin = usePathname();
  const params = useSearchParams();
  if (chemin === "/") return params.get("vue") === "carte" ? "carte" : "explorer";
  if (chemin.startsWith("/dashboard")) return "chiffres";
  if (chemin.startsWith("/moi")) return "moi";
  if (chemin.startsWith("/moderation")) return "moderation";
  if (chemin.startsWith("/admin")) return "admin";
  if (chemin.startsWith("/idees/nouvelle")) return "proposer";
  if (chemin.startsWith("/connexion")) return "connexion";
  return null;
}

/** Liens en ligne de l'en-tête, sur grand écran. */
export function LiensNavigation({ ids }: { ids: IdLien[] }) {
  const courant = useOngletCourant();
  return (
    <nav aria-label="Navigation principale" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {ids.map((id) => {
          const lien = LIENS[id];
          const actif = courant === id;
          return (
            <li key={id}>
              <Link
                href={lien.href}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm transition-colors ${
                  actif
                    ? "bg-foret/12 font-bold text-foret-fonce"
                    : "font-semibold text-gris hover:bg-sable/60 hover:text-encre"
                }`}
              >
                <Icone nom={lien.icone} taille={18} />
                {lien.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Barre d'onglets des petits écrans : Explorer, Carte, Proposer (au centre, en relief), Chiffres, Mon espace.
 * Masquée sur la fiche idée (sa barre d'action la remplace) et dans le formulaire de proposition.
 */
export function BarreOnglets({ connecte }: { connecte: boolean }) {
  const courant = useOngletCourant();
  const chemin = usePathname();
  if (/^\/idees\/\d+/.test(chemin)) return null;
  if (connecte && chemin.startsWith("/idees/nouvelle")) return null;

  const dernier: Lien = connecte
    ? LIENS.moi
    : { id: "moi", href: "/connexion", libelle: "Connexion", icone: "connexion" };
  const actifDernier = connecte ? courant === "moi" : courant === "connexion";

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-trait bg-carte px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-6px_20px_rgb(28_43_36/0.06)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end">
        <Onglet lien={LIENS.explorer} actif={courant === "explorer"} />
        <Onglet lien={LIENS.carte} actif={courant === "carte"} />
        <li className="flex justify-center">
          <Link
            href="/idees/nouvelle"
            aria-current={courant === "proposer" ? "page" : undefined}
            className="-mt-6 flex flex-col items-center gap-1 text-xs leading-none font-bold text-foret-fonce"
          >
            <span className="flex size-[58px] items-center justify-center rounded-full bg-foret text-white shadow-[0_6px_16px_rgb(28_43_36/0.22),0_0_0_5px_var(--color-carte)]">
              <Icone nom="plus" taille={28} epaisseur={2.4} />
            </span>
            Proposer
          </Link>
        </li>
        <Onglet lien={LIENS.chiffres} actif={courant === "chiffres"} />
        <Onglet lien={dernier} actif={actifDernier} />
      </ul>
    </nav>
  );
}

function Onglet({ lien, actif }: { lien: Lien; actif: boolean }) {
  return (
    <li className="flex justify-center">
      <Link
        href={lien.href}
        aria-current={actif ? "page" : undefined}
        className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-[3px] text-xs leading-none ${
          actif ? "font-bold text-foret-fonce" : "font-semibold text-gris"
        }`}
      >
        <span
          className={`flex h-[30px] w-[52px] items-center justify-center rounded-full ${actif ? "bg-foret/12" : ""}`}
        >
          <Icone nom={lien.icone} taille={22} />
        </span>
        {lien.libelle}
      </Link>
    </li>
  );
}
