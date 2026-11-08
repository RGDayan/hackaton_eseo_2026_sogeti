"use client";

import type { ChangeEvent } from "react";
import Form from "next/form";
import Link from "next/link";
import { Fleche, useDefilement } from "@/components/carrousel";
import { Icone } from "@/components/icone";

type Option = { valeur: string; libelle: string };

type Props = {
  actifs: {
    q: string;
    quartier: string;
    categorie: string;
    tag: string;
    tri: string;
  };
  /** Vue affichée sur mobile (liste ou carte), conservée d'une recherche à l'autre. */
  vue: "liste" | "carte";
  quartiers: Option[];
  categories: Option[];
  tags: Option[];
};

// Chaque changement relance le formulaire GET : les filtres vivent dans l'URL et restent partageables.
function soumettre(e: ChangeEvent<HTMLSelectElement>) {
  e.currentTarget.form?.requestSubmit();
}

/** Recherche, puis une rangée de pastilles (quartier, catégorie, tag, tri) qui défile sur mobile. */
export function Filtres({ actifs, vue, quartiers, categories, tags }: Props) {
  const { ref, debut, fin, surDefilement, defiler } =
    useDefilement<HTMLDivElement>();
  const filtre = Boolean(
    actifs.q || actifs.quartier || actifs.categorie || actifs.tag,
  );

  return (
    <Form
      action="/"
      key={JSON.stringify(actifs)}
      className="flex flex-col gap-2.5"
    >
      {vue === "carte" && <input type="hidden" name="vue" value="carte" />}
      <div className="relative">
        <label htmlFor="recherche" className="sr-only">
          Rechercher une idée
        </label>
        <span className="pointer-events-none absolute top-3.5 left-3.5 text-gris">
          <Icone nom="recherche" taille={20} />
        </span>
        <input
          id="recherche"
          name="q"
          type="search"
          defaultValue={actifs.q}
          placeholder="Rechercher une idée, un lieu…"
          className="h-12 w-full rounded-full border border-trait bg-carte pr-28 pl-11 text-[15px] placeholder:text-gris focus:border-foret"
        />
        <button
          type="submit"
          className="absolute top-1 right-1 h-10 rounded-full bg-foret px-4 text-sm font-bold text-white hover:bg-foret-fonce"
        >
          Rechercher
        </button>
      </div>

      {/* Sur mobile, les pastilles défilent : flèches de part et d'autre, masquées quand tout tient. */}
      <div className="flex items-center gap-1.5">
        {!(debut && fin) && (
          <Fleche
            sens={-1}
            taille="petite"
            libelle="Filtres précédents"
            desactivee={debut}
            onClick={() => defiler(-1)}
          />
        )}
        <div
          ref={ref}
          role="group"
          aria-label="Filtres"
          onScroll={surDefilement}
          className="defilement-x flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5 sm:flex-wrap"
        >
          <Pastille
            nom="quartier"
            libelle="Quartier"
            tous="Tous les quartiers"
            valeur={actifs.quartier}
            options={quartiers}
          />
          <Pastille
            nom="categorie"
            libelle="Catégorie"
            tous="Toutes les catégories"
            valeur={actifs.categorie}
            options={categories}
          />
          <Pastille
            nom="tag"
            libelle="Tag"
            tous="Tous les tags"
            valeur={actifs.tag}
            options={tags}
          />
          <Pastille
            nom="tri"
            libelle="Trier par"
            valeur={actifs.tri}
            options={[
              { valeur: "recentes", libelle: "Récentes" },
              { valeur: "mieux-notees", libelle: "Mieux notées" },
            ]}
          />
          {filtre && (
            <Link
              href={vue === "carte" ? "/?vue=carte#fil" : "/#fil"}
              className="flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold whitespace-nowrap text-foret-fonce underline"
            >
              Tout effacer
            </Link>
          )}
        </div>
        {!(debut && fin) && (
          <Fleche
            sens={1}
            taille="petite"
            libelle="Filtres suivants"
            desactivee={fin}
            onClick={() => defiler(1)}
          />
        )}
      </div>
    </Form>
  );
}

type PropsPastille = {
  nom: string;
  libelle: string;
  tous?: string;
  valeur: string;
  options: Option[];
};

/** Liste déroulante native habillée en pastille : pleine (couleur de la ville) quand un filtre est actif. */
function Pastille({ nom, libelle, tous, valeur, options }: PropsPastille) {
  const actif = Boolean(tous && valeur);
  return (
    <div className="relative shrink-0">
      <label htmlFor={`filtre-${nom}`} className="sr-only">
        {libelle}
      </label>
      <select
        id={`filtre-${nom}`}
        name={nom}
        defaultValue={valeur}
        onChange={soumettre}
        className={`h-10 max-w-56 cursor-pointer appearance-none truncate rounded-full border pr-9 pl-3.5 text-sm font-semibold [&>option]:bg-carte [&>option]:text-encre ${
          actif
            ? "border-foret-fonce bg-foret-fonce text-white"
            : "border-trait bg-carte text-encre hover:border-foret"
        }`}
      >
        {tous && <option value="">{libelle}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      <span
        className={`pointer-events-none absolute top-3 right-3 ${actif ? "text-white" : "text-encre"}`}
      >
        <Icone nom="bas" taille={15} />
      </span>
    </div>
  );
}
