// Champs des formulaires d'administration (composants serveur, sans état).

type Ville = {
  nom: string;
  slug: string;
  latitude: number;
  longitude: number;
  zoom: number;
  couleurPrincipale: string;
  couleurPrincipaleFoncee: string;
  couleurAccent: string;
  logoUrl: string | null;
};

type Quartier = { nom: string; slug: string; latitude: number; longitude: number };
type Categorie = { nom: string; slug: string; couleur: string };

function Champ({
  id,
  libelle,
  aide,
  ...input
}: { id: string; libelle: string; aide?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="libelle">
        {libelle}
      </label>
      <input id={id} className="champ" aria-describedby={aide ? `${id}-aide` : undefined} {...input} />
      {aide && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-gris">
          {aide}
        </p>
      )}
    </div>
  );
}

function Couleur({ id, libelle, name, valeur, aide }: { id: string; libelle: string; name: string; valeur: string; aide?: string }) {
  return (
    <div>
      <label htmlFor={id} className="libelle">
        {libelle}
      </label>
      <input id={id} name={name} type="color" defaultValue={valeur} className="h-10 w-20 cursor-pointer rounded-lg border border-trait bg-carte p-1" aria-describedby={aide ? `${id}-aide` : undefined} />
      {aide && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-gris">
          {aide}
        </p>
      )}
    </div>
  );
}

const AIDE_SLUG = "Utilisé dans les adresses. Laissez vide pour le déduire du nom.";

export function ChampsVille({ prefixe, ville }: { prefixe: string; ville?: Ville }) {
  const p = (n: string) => `${prefixe}-${n}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Champ id={p("nom")} name="nom" libelle="Nom" defaultValue={ville?.nom} required maxLength={80} />
      <Champ id={p("slug")} name="slug" libelle="Identifiant d'URL" defaultValue={ville?.slug} maxLength={60} aide={AIDE_SLUG} />
      <Champ id={p("lat")} name="latitude" libelle="Latitude du centre" type="number" step="any" defaultValue={ville?.latitude} required />
      <Champ id={p("lng")} name="longitude" libelle="Longitude du centre" type="number" step="any" defaultValue={ville?.longitude} required />
      <Champ id={p("zoom")} name="zoom" libelle="Zoom de la carte" type="number" min={3} max={18} defaultValue={ville?.zoom ?? 12} required aide="De 3 (pays) à 18 (rue). 12 convient à une métropole." />
      <Champ id={p("logo")} name="logoUrl" libelle="Adresse du logo (facultatif)" type="url" defaultValue={ville?.logoUrl ?? ""} maxLength={500} />
      <fieldset className="sm:col-span-2">
        <legend className="libelle">Charte graphique</legend>
        <div className="flex flex-wrap gap-6">
          <Couleur id={p("c1")} name="couleurPrincipale" libelle="Principale" valeur={ville?.couleurPrincipale ?? "#1f4d3a"} aide="Titres, liens, boutons." />
          <Couleur id={p("c2")} name="couleurPrincipaleFoncee" libelle="Principale foncée" valeur={ville?.couleurPrincipaleFoncee ?? "#163a2b"} aide="Survol des boutons." />
          <Couleur id={p("c3")} name="couleurAccent" libelle="Accent" valeur={ville?.couleurAccent ?? "#f2b632"} />
        </div>
        <p className="mt-2 text-xs text-gris">
          Les couleurs principales doivent contraster à 4,5:1 au moins avec le fond de page et avec un texte blanc
          (accessibilité).
        </p>
      </fieldset>
    </div>
  );
}

export function ChampsQuartier({ prefixe, quartier }: { prefixe: string; quartier?: Quartier }) {
  const p = (n: string) => `${prefixe}-${n}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Champ id={p("nom")} name="nom" libelle="Nom" defaultValue={quartier?.nom} required maxLength={80} />
      <Champ id={p("slug")} name="slug" libelle="Identifiant d'URL" defaultValue={quartier?.slug} maxLength={60} aide={AIDE_SLUG} />
      <Champ id={p("lat")} name="latitude" libelle="Latitude" type="number" step="any" defaultValue={quartier?.latitude} required />
      <Champ id={p("lng")} name="longitude" libelle="Longitude" type="number" step="any" defaultValue={quartier?.longitude} required />
    </div>
  );
}

export function ChampsCategorie({ prefixe, categorie }: { prefixe: string; categorie?: Categorie }) {
  const p = (n: string) => `${prefixe}-${n}`;
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <Champ id={p("nom")} name="nom" libelle="Nom" defaultValue={categorie?.nom} required maxLength={60} />
      <Champ id={p("slug")} name="slug" libelle="Identifiant d'URL" defaultValue={categorie?.slug} maxLength={60} aide={AIDE_SLUG} />
      <Couleur id={p("couleur")} name="couleur" libelle="Couleur" valeur={categorie?.couleur ?? "#1d6fa5"} />
    </div>
  );
}
