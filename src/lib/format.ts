/* Petites mises en forme partagées par les composants serveur et client. */

/** « Grand Besançon Métropole » devient « Besançon », « Dijon Métropole » devient « Dijon ». */
export function nomCourt(nom: string) {
  return nom
    .replace(/^(Grand|Grande)\s+/i, "")
    .replace(/\s+(Métropole|Agglomération|Agglo)$/i, "")
    .trim();
}

/** Lettre du monogramme d'une ville (ou d'un pseudo) : première lettre, en majuscule. */
export function monogramme(texte: string) {
  const lettre = nomCourt(texte).match(/\p{L}/u)?.[0] ?? texte.charAt(0);
  return lettre.toUpperCase();
}

const nombre = new Intl.NumberFormat("fr-FR");

/** « 1 idée », « 12 idées ». */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`) {
  return `${nombre.format(n)} ${n > 1 ? plurielForme : singulier}`;
}

const formatDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const formatDateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export function dateFr(date: Date) {
  return formatDate.format(date);
}

export function dateCourte(date: Date) {
  return formatDateCourte.format(date);
}

export function tailleLisible(octets: number) {
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

/** Extension d'un nom de fichier, en majuscules (« PDF », « DOCX »). */
export function extension(nom: string) {
  const morceaux = nom.split(".");
  return morceaux.length > 1 ? morceaux.pop()!.toUpperCase() : "FICHIER";
}
