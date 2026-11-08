import Link from "next/link";
import { Icone } from "@/components/icone";
import { Monogramme } from "@/components/monogramme";
import { BarreOnglets, LiensNavigation, type IdLien } from "@/components/navigation";
import { estModerateur } from "@/lib/droits";
import { monogramme } from "@/lib/format";
import { getUtilisateur } from "@/lib/session";
import { getVilleCourante, listerVilles } from "@/lib/ville";

/**
 * En-tête aux couleurs de la ville : monogramme et nom de la ville, « Changer de ville ».
 * Sur grand écran, il porte aussi la navigation, le bouton « Proposer » et le compte.
 */
export async function EnTete() {
  const [ville, villes, utilisateur] = await Promise.all([getVilleCourante(), listerVilles(), getUtilisateur()]);

  const liens: IdLien[] = ["explorer", "carte", "chiffres"];
  if (utilisateur) liens.push("moi");
  if (estModerateur(utilisateur)) liens.push("moderation", "admin");

  return (
    <header className="sticky top-0 z-30 border-b border-trait bg-papier/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2.5 px-3 sm:px-6 lg:gap-6">
        <Link
          href="/"
          aria-label={`${ville.nom}, accueil`}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl pl-1 text-foret-fonce lg:flex-none"
        >
          <Monogramme nom={ville.nom} logo={ville.logoUrl} />
          <span className="font-titre text-base leading-tight font-semibold text-balance lg:text-lg">{ville.nom}</span>
        </Link>

        <LiensNavigation ids={liens} />

        <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
          {villes.length > 1 && (
            <Link
              href="/villes"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-trait bg-carte py-0 pr-3.5 pl-3 text-[13px] font-semibold whitespace-nowrap transition-colors hover:border-foret"
            >
              <Icone nom="changer" taille={16} />
              Changer de ville
            </Link>
          )}
          <Link href="/idees/nouvelle" className="bouton-plein hidden lg:inline-flex">
            <Icone nom="plus" taille={18} epaisseur={2.6} />
            Proposer une idée
          </Link>
          {utilisateur ? (
            <Link
              href="/moi"
              aria-label={`Mon espace (${utilisateur.nickname})`}
              className="hidden size-11 items-center justify-center rounded-full bg-soleil font-titre text-lg font-semibold text-encre ring-2 ring-foret ring-offset-2 ring-offset-papier lg:flex"
            >
              <span aria-hidden>{monogramme(utilisateur.nickname)}</span>
            </Link>
          ) : (
            <Link href="/connexion" className="bouton-contour hidden lg:inline-flex">
              <Icone nom="connexion" taille={17} />
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** Barre d'onglets mobile : lit la session côté serveur pour proposer « Mon espace » ou « Connexion ». */
export async function Onglets() {
  const utilisateur = await getUtilisateur();
  return <BarreOnglets connecte={Boolean(utilisateur)} />;
}

export async function PiedDePage() {
  const ville = await getVilleCourante();
  return (
    <footer className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-3 border-t border-trait pt-5 pb-8 text-[13px] text-gris lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <Monogramme nom={ville.nom} logo={ville.logoUrl} taille="petit" />
          <span className="font-semibold text-encre">{ville.nom}</span>
        </div>
        <p>Aucune donnée personnelle demandée</p>
      </div>
    </footer>
  );
}
