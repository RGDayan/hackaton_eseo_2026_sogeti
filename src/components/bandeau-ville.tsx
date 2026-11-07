import Link from "next/link";
import { getVilleCourante, listerVilles } from "@/lib/ville";

/** Bandeau fin au-dessus de la navbar : ville courante et lien vers le choix de la ville. */
export async function BandeauVille() {
  const [ville, villes] = await Promise.all([getVilleCourante(), listerVilles()]);

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-sm sm:px-6">
      <span aria-hidden>📍</span>
      <span className="font-semibold">{ville.nom}</span>
      {villes.length > 1 && (
        <>
          <span aria-hidden>·</span>
          <Link href="/villes" className="underline-offset-2 hover:underline">
            Changer de ville
          </Link>
        </>
      )}
    </div>
  );
}
