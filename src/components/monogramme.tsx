import { monogramme } from "@/lib/format";

const TAILLES = {
  petit: "size-7 rounded-[9px] text-[15px]",
  moyen: "size-[38px] rounded-xl text-[21px]",
  grand: "size-[52px] rounded-2xl text-[27px] border-[3px] border-carte",
} as const;

const PASTILLES = {
  petit: "hidden",
  moyen: "-right-[3px] -top-[3px] size-[11px]",
  grand: "-right-1 -top-1 size-[13px]",
} as const;

type Props = {
  nom: string;
  taille?: keyof typeof TAILLES;
  /** Couleur du liseré de la pastille, pour qu'elle se détache du fond. */
  fond?: string;
  /** Inverse les couleurs (lettre de la ville sur fond papier), pour les fonds colorés. */
  inverse?: boolean;
  /** Logo de la ville (URL complète http ou https, saisie dans l'admin) : remplace l'initiale. */
  logo?: string | null;
};

/** Monogramme de la ville : initiale sur la couleur principale, pastille de la couleur d'accent. */
export function Monogramme({ nom, taille = "moyen", fond = "var(--color-papier)", inverse = false, logo }: Props) {
  if (logo) {
    return (
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-trait bg-carte p-1 ${TAILLES[taille]}`}
      >
        {/* Image externe à l'URL libre : next/image exigerait de déclarer chaque domaine. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="size-full object-contain" referrerPolicy="no-referrer" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center font-titre leading-none font-semibold ${TAILLES[taille]} ${
        inverse ? "bg-carte text-foret-fonce" : "bg-foret text-white"
      }`}
    >
      {monogramme(nom)}
      <span
        className={`absolute rounded-full border-2 bg-soleil ${PASTILLES[taille]}`}
        style={{ borderColor: fond }}
      />
    </span>
  );
}
