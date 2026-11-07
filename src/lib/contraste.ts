// Calcul du contraste WCAG 2.1 entre deux couleurs #rrggbb.

export const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string) {
  const canaux = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canaux.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratioContraste(a: string, b: string) {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
}

/** Fond de page (`--color-papier`) et texte des boutons pleins : la couleur principale doit contraster avec les deux. */
export const FOND_PAPIER = "#f7f2e8";
export const BLANC = "#ffffff";
export const CONTRASTE_MIN = 4.5;

export function contrasteSuffisant(couleur: string) {
  return (
    HEX.test(couleur) &&
    ratioContraste(couleur, FOND_PAPIER) >= CONTRASTE_MIN &&
    ratioContraste(couleur, BLANC) >= CONTRASTE_MIN
  );
}
