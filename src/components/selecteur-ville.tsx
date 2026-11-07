import { choisirVille } from "@/app/actions";
import { getVilleCourante, listerVilles } from "@/lib/ville";

/**
 * Sélecteur de ville. Validation par un bouton explicite, sans envoi automatique au changement :
 * au clavier, parcourir la liste ne doit pas changer de ville à chaque flèche (WCAG 3.2.2).
 * Fonctionne aussi sans JavaScript.
 */
export async function SelecteurVille() {
  const [villes, courante] = await Promise.all([listerVilles(), getVilleCourante()]);
  if (villes.length < 2) return null;

  return (
    <form action={choisirVille} className="flex items-center gap-1.5">
      <label htmlFor="selecteur-ville" className="sr-only">
        Choisir votre ville
      </label>
      <select
        id="selecteur-ville"
        name="ville"
        defaultValue={courante.slug}
        key={courante.slug}
        className="max-w-44 rounded-full border border-trait bg-carte py-1.5 pr-8 pl-3 text-sm font-semibold text-encre focus:border-foret"
      >
        {villes.map((v) => (
          <option key={v.slug} value={v.slug}>
            {v.nom}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-full px-2 py-1.5 text-sm font-semibold text-foret hover:underline">
        Changer
      </button>
    </form>
  );
}
