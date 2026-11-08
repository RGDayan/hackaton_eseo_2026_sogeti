import Link from "next/link";

/* Graphiques en HTML et SVG, rendus côté serveur : aucune bibliothèque, donc rien à charger dans le navigateur. */

export type PointHisto = { cle: string; valeur: number; libelle: string };

type PropsHisto = {
  points: PointHisto[];
  /** Étiquettes affichées sous l'axe, de gauche à droite. */
  axe: string[];
  /** Phrase lue par les lecteurs d'écran à la place des barres. */
  description: string;
  unite: string;
};

/** Histogramme vertical sur fond sombre. Chaque barre a une info-bulle au survol. */
export function Histogramme({ points, axe, description, unite }: PropsHisto) {
  const max = Math.max(1, ...points.map((p) => p.valeur));

  return (
    <div role="img" aria-label={description}>
      <div className="flex gap-3">
        <div className="flex h-48 flex-col justify-between text-xs text-papier/70 tabular-nums" aria-hidden>
          <span>{max}</span>
          <span>0</span>
        </div>

        <div className="relative h-48 flex-1" aria-hidden>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`border-t ${i === 3 ? "border-papier/40" : "border-papier/15"}`} />
            ))}
          </div>

          <div className="relative flex h-full items-end gap-[3px] sm:gap-1.5">
            {points.map((p, i) => (
              <div
                key={p.cle}
                className="flex h-full flex-1 items-end"
                title={`${p.libelle} : ${p.valeur} ${unite}${p.valeur > 1 ? "s" : ""}`}
              >
                <div
                  className={`barre-v w-full rounded-t-[3px] ${p.valeur === 0 ? "bg-papier/25" : "bg-soleil"}`}
                  style={{
                    height: p.valeur === 0 ? "3px" : `${(p.valeur / max) * 100}%`,
                    animationDelay: `${i * 20}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-between pl-9 text-xs text-papier/70" aria-hidden>
        {axe.map((etiquette) => (
          <span key={etiquette}>{etiquette}</span>
        ))}
      </div>
    </div>
  );
}

export type LigneBarre = {
  libelle: string;
  valeur: number;
  detail: string;
  couleur: string;
  href?: string;
};

/** Barres horizontales classées, avec un lien optionnel vers la liste filtrée. */
export function BarresHorizontales({ lignes }: { lignes: LigneBarre[] }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));

  return (
    <ul className="space-y-4">
      {lignes.map((l, i) => (
        <li key={l.libelle}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
            {l.href ? (
              <Link href={l.href} className="-my-1 min-w-0 truncate py-1 font-semibold hover:text-foret hover:underline">
                {l.libelle}
              </Link>
            ) : (
              <span className="min-w-0 truncate font-semibold">{l.libelle}</span>
            )}
            <span className="shrink-0 text-xs text-gris sm:text-sm">{l.detail}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-trait/60" aria-hidden>
            <div
              className="barre-h h-full rounded-full"
              style={{
                width: l.valeur === 0 ? "0" : `${Math.max(3, (l.valeur / max) * 100)}%`,
                backgroundColor: l.couleur,
                animationDelay: `${i * 70}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
