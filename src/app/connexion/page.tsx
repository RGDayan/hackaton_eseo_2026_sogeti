import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connexionDemo, type ProfilDemo } from "@/app/actions";
import { Icone, type NomIcone } from "@/components/icone";
import { Monogramme } from "@/components/monogramme";
import { nomCourt } from "@/lib/format";
import { getUtilisateur } from "@/lib/session";
import { cheminSur } from "@/lib/validation";
import { getVilleCourante } from "@/lib/ville";

type Alerte = { icone: NomIcone; titre: string; texte: string; erreur: boolean };

const MESSAGES: Record<string, Alerte> = {
  indisponible: {
    icone: "alerte",
    titre: "Le service de connexion est momentanément indisponible.",
    texte: "Réessayez dans un instant. Vous pouvez continuer à consulter les idées.",
    erreur: true,
  },
  annulee: {
    icone: "info",
    titre: "La connexion a été annulée.",
    texte: "Aucun souci : vous pouvez réessayer quand vous voulez.",
    erreur: false,
  },
  echec: {
    icone: "alerte",
    titre: "La connexion n'a pas abouti.",
    texte: "Réessayez dans un instant.",
    erreur: true,
  },
};

const PROFILS: { profil: ProfilDemo; libelle: string }[] = [
  { profil: "habitant", libelle: "Habitant" },
  { profil: "moderateur-dijon", libelle: "Modérateur Dijon" },
  { profil: "moderateur-besancon", libelle: "Modérateur Besançon" },
  { profil: "super-admin", libelle: "Super-admin" },
];

export default function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-[18px] pt-3 lg:grid-cols-2 lg:items-stretch lg:gap-10 lg:pt-10">
      <Suspense fallback={<div className="min-h-[220px] animate-pulse rounded-[28px] bg-foret/80" />}>
        <Bandeau />
      </Suspense>
      <Suspense fallback={<div className="h-72" />}>
        <Contenu searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Bandeau() {
  const ville = await getVilleCourante();
  return (
    <section className="relative -mx-1 overflow-hidden rounded-[28px] bg-foret text-white sm:mx-0">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -top-20 -right-16 size-64 rounded-full bg-soleil opacity-25" />
        <span className="absolute -bottom-10 left-1/4 size-40 rounded-full border-[18px] border-white/10" />
        <span className="absolute inset-0 bg-linear-to-b from-transparent to-foret-fonce" />
      </div>
      <div className="relative flex min-h-[220px] flex-col justify-end gap-3 px-5 pt-6 pb-[22px] lg:h-full lg:min-h-[420px] lg:p-10">
        <Monogramme nom={ville.nom} logo={ville.logoUrl} taille="grand" inverse fond="var(--color-foret)" />
        <h1 className="font-titre text-[30px] leading-[1.08] font-semibold tracking-[-0.015em] lg:text-5xl">
          Rejoignez les habitants de {nomCourt(ville.nom)}
        </h1>
        <p className="text-[15px] leading-[1.45] lg:text-lg">
          Un compte pour proposer, voter et commenter, dans toutes les villes de Quartea.
        </p>
      </div>
    </section>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const params = await searchParams;
  const suivant = cheminSur(params.next);
  if (await getUtilisateur()) redirect(suivant);

  const alerte = typeof params.erreur === "string" ? MESSAGES[params.erreur] : undefined;
  const retour = encodeURIComponent(suivant);
  const ville = await getVilleCourante();

  return (
    <div className="flex flex-col gap-3 px-2 sm:px-0 lg:justify-center">
      {alerte && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-[14.5px] leading-[1.45] ${
            alerte.erreur ? "bg-tomate-clair text-[#7d2412]" : "bg-sable text-encre"
          }`}
        >
          <Icone nom={alerte.icone} taille={20} />
          <span>
            <strong>{alerte.titre}</strong>
            <br />
            {alerte.texte}
          </span>
        </div>
      )}

      <a href={`/auth/login?inscription=1&next=${retour}`} className="bouton-plein h-[54px] text-[16.5px]">
        Créer un compte
        <span className="text-sm font-medium opacity-90">· 20 s</span>
      </a>
      <a href={`/auth/login?next=${retour}`} className="bouton-contour h-[54px] text-[16.5px]">
        Se connecter
      </a>

      <div className="mt-1 flex items-start gap-3 rounded-[18px] bg-soleil/15 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-carte text-foret-fonce">
          <Icone nom="bouclier" taille={20} />
        </span>
        <p className="text-[14.5px] leading-normal">
          Un pseudo et un mot de passe suffisent. Pas d&apos;e-mail obligatoire, aucune donnée personnelle demandée.
        </p>
      </div>

      {process.env.MODE_DEMO === "true" && (
        <section aria-labelledby="titre-demo" className="mt-1.5 rounded-2xl border-[1.5px] border-dashed border-trait-fonce p-3.5">
          <h2 id="titre-demo" className="text-sm font-bold">
            Mode démo
          </h2>
          <p className="mt-0.5 mb-2.5 text-[13px] text-gris">
            Comptes fictifs, connexion immédiate sans Keycloak. Ville affichée : {nomCourt(ville.nom)}.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROFILS.map(({ profil, libelle }) => (
              <form key={profil} action={connexionDemo}>
                <input type="hidden" name="profil" value={profil} />
                <input type="hidden" name="next" value={suivant} />
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-full border border-trait bg-carte px-2 text-[13px] font-semibold hover:border-foret"
                >
                  {libelle}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
