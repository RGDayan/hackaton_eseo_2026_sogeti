import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connexionDemo, type ProfilDemo } from "@/app/actions";
import { getUtilisateur } from "@/lib/session";
import { cheminSur } from "@/lib/validation";

const MESSAGES: Record<string, string> = {
  indisponible: "Le service de connexion est momentanément indisponible. Réessayez dans un instant.",
  annulee: "La connexion a été annulée.",
  echec: "La connexion n'a pas abouti. Réessayez.",
};

const PROFILS: { profil: ProfilDemo; libelle: string }[] = [
  { profil: "habitant", libelle: "Habitant" },
  { profil: "moderateur-dijon", libelle: "Modérateur Dijon" },
  { profil: "moderateur-besancon", libelle: "Modérateur Besançon" },
  { profil: "super-admin", libelle: "Super-admin" },
];

export default function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="mx-auto max-w-md py-14">
      <div className="rounded-2xl border border-trait bg-carte p-6 sm:p-8">
        <h1 className="font-titre text-3xl font-semibold text-foret">Connexion</h1>
        <p className="mt-2 text-sm leading-relaxed text-gris">
          Un compte suffit pour proposer des idées et voter, dans toutes les villes. Seuls un identifiant et un mot
          de passe sont demandés ; l&apos;e-mail est facultatif.
        </p>
        <Suspense fallback={<div className="mt-6 h-36" />}>
          <Contenu searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const params = await searchParams;
  const suivant = cheminSur(params.next);
  if (await getUtilisateur()) redirect(suivant);

  const message = typeof params.erreur === "string" ? MESSAGES[params.erreur] : undefined;
  const retour = encodeURIComponent(suivant);

  return (
    <>
      {message && (
        <p role="alert" className="erreur mt-4">
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <a href={`/auth/login?next=${retour}`} className="bouton-plein">
          Se connecter
        </a>
        <a href={`/auth/login?inscription=1&next=${retour}`} className="bouton-contour">
          Créer un compte
        </a>
      </div>

      {process.env.MODE_DEMO === "true" && (
        <section aria-labelledby="titre-demo" className="mt-8 rounded-xl border border-dashed border-trait p-4">
          <h2 id="titre-demo" className="text-sm font-semibold">
            Mode démo
          </h2>
          <p className="mt-1 text-sm text-gris">Comptes fictifs, connexion immédiate sans Keycloak.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PROFILS.map(({ profil, libelle }) => (
              <form key={profil} action={connexionDemo}>
                <input type="hidden" name="profil" value={profil} />
                <input type="hidden" name="next" value={suivant} />
                <button type="submit" className="bouton-contour w-full">
                  {libelle}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
