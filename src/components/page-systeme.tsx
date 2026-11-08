import Link from "next/link";

type Props = {
  /** Grand texte décoratif : « 404 », « Oups »… */
  grand: string;
  titre: string;
  texte: string;
  actions: { href: string; libelle: string }[];
  /** Affiche un bouton « Réessayer » en premier (pages d'erreur). */
  reessayer?: () => void;
  reference?: string;
};

/** Pages 404 et erreur : illustration, message et actions. */
export function PageSysteme({ grand, titre, texte, actions, reessayer, reference }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-2 pt-10 pb-6 text-center lg:pt-16">
      <div aria-hidden className="relative mb-1.5 h-40 w-[200px]">
        <span className="absolute top-2.5 left-[30px] size-[140px] rounded-full bg-soleil opacity-30" />
        <span className="absolute inset-x-0 top-[38px] text-center font-titre text-[76px] leading-none font-semibold tracking-[-0.04em] text-foret">
          {grand}
        </span>
        <span className="absolute top-28 left-6 h-3.5 w-[152px] rounded-[50%] bg-[#e4dcc8]" />
      </div>
      <h1 className="font-titre text-[27px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">{titre}</h1>
      <p className="max-w-[310px] text-[15.5px] leading-normal text-gris">{texte}</p>
      <div className="mt-3.5 flex w-full flex-col gap-2.5">
        {reessayer && (
          <button type="button" onClick={() => reessayer()} className="bouton-plein bouton-grand">
            Réessayer
          </button>
        )}
        {actions.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${i === 0 && !reessayer ? "bouton-plein" : "bouton-contour"} bouton-grand`}
          >
            {a.libelle}
          </Link>
        ))}
      </div>
      {reference && (
        <p className="mt-2.5 text-[12.5px] text-gris">
          Référence de l&apos;erreur : <code className="rounded bg-sable px-1.5 py-px text-xs">{reference}</code>
        </p>
      )}
    </div>
  );
}
