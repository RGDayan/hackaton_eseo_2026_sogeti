import { HEX } from "@/lib/contraste";
import { getVilleCourante } from "@/lib/ville";

/**
 * Charte graphique de la ville courante : surcharge les variables du thème Tailwind
 * (définies dans `src/app/globals.css`). Les couleurs sont revalidées ici avant injection.
 */
export async function ThemeVille() {
  const ville = await getVilleCourante();
  const variables = {
    "--color-foret": ville.couleurPrincipale,
    "--color-foret-fonce": ville.couleurPrincipaleFoncee,
    "--color-soleil": ville.couleurAccent,
  };
  const css = Object.entries(variables)
    .filter(([, valeur]) => HEX.test(valeur))
    .map(([nom, valeur]) => `${nom}:${valeur};`)
    .join("");

  return <style>{`:root{${css}}`}</style>;
}

/** Nom de la ville courante, affiché à côté du nom de l'application. */
export async function NomVille() {
  const ville = await getVilleCourante();
  return <span className="text-sm font-semibold text-gris">{ville.nom}</span>;
}
