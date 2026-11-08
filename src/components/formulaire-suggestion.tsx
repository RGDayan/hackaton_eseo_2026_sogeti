"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { creerSuggestion } from "@/app/actions";
import { CarteChoixPosition } from "@/components/carte-lazy";
import type { Point } from "@/components/carte";
import { Icone, pictoCategorie } from "@/components/icone";
import { extension, tailleLisible } from "@/lib/format";
import {
  EXTENSIONS_ACCEPTEES,
  MAX_FICHIERS,
  MAX_TAGS,
  TAILLE_MAX_FICHIER,
  type EtatSuggestion,
} from "@/lib/validation";

type Categorie = { id: number; nom: string; slug: string; couleur: string };

type Props = {
  categories: Categorie[];
  /** Quartiers de la ville courante, avec les catégories qui y sont proposées. */
  quartiers: (Point & { id: number; nom: string; categorieIds: number[] })[];
  centreVille: Point;
  tagsExistants: string[];
  pseudo: string;
};

type Champ = keyof NonNullable<EtatSuggestion["erreurs"]>;

/** Étape où se trouve chaque champ, pour y revenir quand le serveur le refuse. */
const ETAPE_DU_CHAMP: Record<Champ, number> = {
  titre: 1,
  description: 1,
  localisationId: 2,
  latitude: 2,
  categorieId: 3,
  tags: 3,
  fichiers: 3,
};

const LIBELLES: Record<Champ, string> = {
  titre: "Titre",
  description: "Description",
  localisationId: "Quartier",
  latitude: "Emplacement",
  categorieId: "Catégorie",
  tags: "Tags",
  fichiers: "Fichiers",
};

const ANCRES: Record<Champ, string> = {
  titre: "titre",
  description: "description",
  localisationId: "quartiers",
  latitude: "carte-position",
  categorieId: "categories",
  tags: "saisie-tag",
  fichiers: "fichiers",
};

/**
 * Proposer une idée en 4 étapes : idée, lieu, précisions, relecture.
 * Tous les champs restent dans un seul formulaire (les étapes inactives sont masquées) :
 * l'envoi final transmet tout d'un coup à la Server Action, qui revalide chaque champ.
 */
export function FormulaireSuggestion({ categories, quartiers, centreVille, tagsExistants, pseudo }: Props) {
  const router = useRouter();
  const champFichiers = useRef<HTMLInputElement>(null);
  const [etape, setEtape] = useState(1);
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});
  const [erreurGlobale, setErreurGlobale] = useState("");
  const [resumeServeur, setResumeServeur] = useState(false);
  const [enCours, demarrer] = useTransition();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [quartierId, setQuartierId] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [position, setPosition] = useState<Point | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saisieTag, setSaisieTag] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [geoloc, setGeoloc] = useState("");

  const quartierChoisi = quartiers.find((q) => String(q.id) === quartierId);
  const categorieChoisie = categories.find((c) => String(c.id) === categorieId);

  const centre = useMemo(
    () => (quartierChoisi ? { latitude: quartierChoisi.latitude, longitude: quartierChoisi.longitude } : centreVille),
    [quartierChoisi, centreVille],
  );

  // Seules les catégories proposées dans le quartier choisi sont disponibles.
  const categoriesDuQuartier = quartierChoisi
    ? categories.filter((c) => quartierChoisi.categorieIds.includes(c.id))
    : [];
  const suggestionsTags = tagsExistants.filter((t) => !tags.includes(t)).slice(0, 6);

  function changerQuartier(valeur: string) {
    setQuartierId(valeur);
    const suivant = quartiers.find((q) => String(q.id) === valeur);
    if (!suivant?.categorieIds.includes(Number(categorieId))) setCategorieId("");
    setErreurs((e) => ({ ...e, localisationId: undefined }));
  }

  function ajouterTag(valeur: string, liste = tags) {
    const tag = valeur.trim().replace(/^#/, "").toLowerCase();
    setSaisieTag("");
    if (tag.length < 2 || liste.includes(tag) || liste.length >= MAX_TAGS) return liste;
    const suivante = [...liste, tag];
    setTags(suivante);
    return suivante;
  }

  function toucheTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      ajouterTag(saisieTag);
    }
  }

  /** Remplace la liste de fichiers du champ natif (seule façon d'en retirer un). */
  function definirFichiers(liste: File[]) {
    const transfert = new DataTransfer();
    liste.forEach((f) => transfert.items.add(f));
    if (champFichiers.current) champFichiers.current.files = transfert.files;
    setFichiers(liste);
  }

  function choisirFichiers(e: ChangeEvent<HTMLInputElement>) {
    // Les fichiers déjà choisis sont conservés : on ajoute la nouvelle sélection à la suite.
    const nouveaux = Array.from(e.target.files ?? []);
    const liste = [...fichiers, ...nouveaux.filter((n) => !fichiers.some((f) => f.name === n.name && f.size === n.size))];
    let message = "";
    const tropGros = liste.find((f) => f.size > TAILLE_MAX_FICHIER);
    if (tropGros) message = `« ${tropGros.name} » dépasse 5 Mo.`;
    else if (liste.length > MAX_FICHIERS) message = `${MAX_FICHIERS} fichiers maximum.`;
    setErreurs((er) => ({ ...er, fichiers: message || undefined }));
    definirFichiers(message ? fichiers : liste);
  }

  function utiliserMaPosition() {
    if (!navigator.geolocation) return setGeoloc("La géolocalisation n'est pas disponible sur cet appareil.");
    setGeoloc("Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setGeoloc("Épingle placée à votre position. Vous pouvez la déplacer en touchant la carte.");
      },
      () => setGeoloc("Position introuvable. Touchez la carte pour placer l'épingle."),
      { timeout: 10000 },
    );
  }

  /** Contrôles de l'étape avant d'avancer ; le serveur revérifie tout à l'envoi. */
  function verifier(n: number) {
    const e: Partial<Record<Champ, string>> = {};
    if (n === 1) {
      const t = titre.trim();
      if (t.length < 5) e.titre = "Le titre doit faire au moins 5 caractères.";
      if (description.trim().length < 20) e.description = "Décrivez votre idée en 20 caractères au moins.";
    }
    if (n === 2 && !quartierId) e.localisationId = "Choisissez un quartier.";
    if (n === 3 && !categorieId) e.categorieId = "Choisissez une catégorie.";
    return e;
  }

  function allerA(n: number, focus?: string) {
    setEtape(n);
    window.scrollTo({ top: 0 });
    // Le focus suit le changement d'étape : sur le titre de l'étape, ou sur le champ à corriger.
    window.setTimeout(() => document.getElementById(focus ?? `titre-etape-${n}`)?.focus(), 50);
  }

  function continuer() {
    const e = verifier(etape);
    setErreurs((avant) => ({ ...avant, ...e }));
    const premier = Object.keys(e)[0] as Champ | undefined;
    if (premier) return document.getElementById(ANCRES[premier])?.focus();
    setResumeServeur(false);
    allerA(etape + 1);
  }

  // Soumission manuelle : l'action native viderait le formulaire, fichiers compris, en cas d'erreur.
  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (etape < 4) return continuer();
    const donnees = new FormData(e.currentTarget);
    ajouterTag(saisieTag).forEach((tag) => donnees.append("tags", tag));

    demarrer(async () => {
      const resultat = await creerSuggestion(donnees);
      if (resultat.id !== undefined) {
        router.push(`/idees/${resultat.id}?nouvelle=1`);
        return;
      }
      setErreurs(resultat.erreurs ?? {});
      setErreurGlobale(resultat.erreur ?? "");
      const champs = Object.keys(resultat.erreurs ?? {}) as Champ[];
      if (champs.length > 0) {
        setResumeServeur(true);
        allerA(Math.min(...champs.map((c) => ETAPE_DU_CHAMP[c])), "resume-erreurs");
      }
    });
  }

  const erreursActives = (Object.entries(erreurs) as [Champ, string | undefined][]).filter(([, m]) => m);

  return (
    <form onSubmit={soumettre} noValidate className="flex flex-col">
      {/* En-tête : progression. */}
      <div className="sticky top-16 z-10 -mx-4 border-b border-trait bg-papier px-4 pt-2 pb-3 sm:mx-0 sm:px-0 lg:static lg:border-0 lg:pt-0">
        <div className="flex items-center gap-1">
          <Link href="/" aria-label="Quitter le formulaire" className="-ml-2.5 flex size-11 items-center justify-center rounded-full">
            <Icone nom="fermer" taille={22} />
          </Link>
          <p className="flex-1 text-[15px] font-bold">Proposer une idée</p>
        </div>
        <p className="mt-1.5 mb-2 text-[13px] text-gris">
          Étape <strong className="text-encre">{etape}</strong> sur 4
        </p>
        <div
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={etape}
          aria-valuetext={`Étape ${etape} sur 4`}
          className="grid grid-cols-4 gap-[5px]"
        >
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 rounded-full transition-colors duration-300 ${n <= etape ? "bg-foret" : "bg-trait"}`} />
          ))}
        </div>
      </div>

      <div className="pt-6">
        {(resumeServeur || erreurGlobale) && (erreursActives.length > 0 || erreurGlobale) && (
          <div
            id="resume-erreurs"
            role="alert"
            tabIndex={-1}
            className="mb-5 rounded-2xl border-[1.5px] border-[#e8b9ab] bg-tomate-clair px-4 py-3.5 text-[#7d2412]"
          >
            <p className="flex items-center gap-2 text-[15px] font-bold">
              <Icone nom="alerte" taille={19} />
              Votre idée n&apos;a pas pu être publiée
            </p>
            {erreurGlobale && <p className="mt-1.5 text-sm">{erreurGlobale}</p>}
            {erreursActives.length > 0 && (
              <>
                <p className="mt-1.5 mb-1.5 text-sm">
                  {erreursActives.length > 1 ? `${erreursActives.length} champs sont à corriger :` : "Un champ est à corriger :"}
                </p>
                <ul className="list-disc pl-5 text-sm leading-relaxed">
                  {erreursActives.map(([champ, message]) => (
                    <li key={champ}>
                      <button
                        type="button"
                        onClick={() => allerA(ETAPE_DU_CHAMP[champ], ANCRES[champ])}
                        className="text-left font-semibold underline"
                      >
                        {LIBELLES[champ]} : {message}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Étape 1 : l'idée. */}
        <div hidden={etape !== 1}>
          <TitreEtape n={1} titre="Quelle est votre idée ?" sousTitre="Court et concret : ce que vous proposez, et où." />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="titre" className="text-[15px] font-bold">
              Titre
            </label>
            <input
              id="titre"
              name="titre"
              value={titre}
              onChange={(e) => {
                setTitre(e.target.value);
                if (erreurs.titre) setErreurs((er) => ({ ...er, titre: undefined }));
              }}
              maxLength={120}
              aria-invalid={Boolean(erreurs.titre)}
              aria-describedby="titre-aide titre-erreur"
              className="champ h-[52px]"
            />
            <div className="flex justify-between gap-2.5 text-[13px] text-gris">
              <span id="titre-aide">5 caractères minimum</span>
              <span className="tabular-nums">{titre.length} / 120</span>
            </div>
            <Erreur id="titre-erreur" message={erreurs.titre} />
          </div>
          <div className="mt-[22px] flex flex-col gap-1.5">
            <label htmlFor="description" className="text-[15px] font-bold">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              maxLength={3000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (erreurs.description) setErreurs((er) => ({ ...er, description: undefined }));
              }}
              placeholder="Quel problème votre idée résout-elle ? Comment la mettre en place ?"
              aria-invalid={Boolean(erreurs.description)}
              aria-describedby="description-aide description-erreur"
              className="champ resize-y leading-normal"
            />
            <div className="flex justify-between gap-2.5 text-[13px] text-gris">
              <span id="description-aide">20 caractères minimum</span>
              <span className="tabular-nums">{description.length} / 3000</span>
            </div>
            <Erreur id="description-erreur" message={erreurs.description} />
          </div>
        </div>

        {/* Étape 2 : le lieu. */}
        <div hidden={etape !== 2}>
          <TitreEtape n={2} titre="Où se situe votre idée ?" sousTitre="Choisissez le quartier, puis placez une épingle si vous le souhaitez." />
          <fieldset aria-describedby="quartier-erreur">
            <legend className="mb-2.5 text-[15px] font-bold">Quartier</legend>
            <div id="quartiers" tabIndex={-1} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quartiers.map((q) => {
                const actif = String(q.id) === quartierId;
                return (
                  <label
                    key={q.id}
                    className={`flex min-h-12 cursor-pointer items-center justify-between gap-1.5 rounded-[14px] px-3 py-2 text-[14.5px] font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foret ${
                      actif ? "border-2 border-foret bg-foret/8" : "border border-trait bg-carte hover:border-foret"
                    }`}
                  >
                    <input
                      type="radio"
                      name="localisationId"
                      value={q.id}
                      checked={actif}
                      onChange={(e) => changerQuartier(e.target.value)}
                      className="sr-only"
                    />
                    {q.nom}
                    {actif && (
                      <span className="text-foret-fonce">
                        <Icone nom="valider" taille={17} epaisseur={3} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <Erreur id="quartier-erreur" message={erreurs.localisationId} />
          </fieldset>

          <p className="mt-[22px] mb-1 text-[15px] font-bold">
            Emplacement précis <span className="font-medium text-gris">(facultatif)</span>
          </p>
          <p id="aide-carte" className="mb-2.5 text-sm text-gris">
            Touchez la carte pour placer l&apos;épingle. Touchez ailleurs pour la déplacer.
          </p>
          <div id="carte-position" tabIndex={-1} aria-describedby="aide-carte" className="relative isolate h-[230px] overflow-hidden rounded-[18px] border border-trait lg:h-80">
            {etape === 2 && <CarteChoixPosition centre={centre} position={position} onChange={setPosition} />}
            <span className="pointer-events-none absolute top-2.5 left-2.5 z-[1000] rounded-full bg-carte px-[11px] py-[5px] text-[12.5px] font-bold shadow-[0_2px_6px_rgb(0_0_0/0.1)]">
              {position ? "Épingle placée" : quartierChoisi ? `Centré sur ${quartierChoisi.nom}` : "Centré sur la ville"}
            </span>
          </div>
          <input type="hidden" name="latitude" value={position?.latitude ?? ""} />
          <input type="hidden" name="longitude" value={position?.longitude ?? ""} />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={utiliserMaPosition} className="bouton-contour">
              <Icone nom="position" taille={17} />
              Utiliser ma position
            </button>
            {position && (
              <button type="button" onClick={() => setPosition(null)} className="min-h-11 px-2.5 text-sm font-semibold text-gris underline">
                Retirer l&apos;épingle
              </button>
            )}
          </div>
          <p aria-live="polite" className="mt-1.5 text-sm text-gris">
            {geoloc}
          </p>
          <Erreur message={erreurs.latitude} />
        </div>

        {/* Étape 3 : catégorie, tags, fichiers. */}
        <div hidden={etape !== 3}>
          <TitreEtape n={3} titre="Quelques précisions" sousTitre="Pour que vos voisins trouvent facilement votre idée." />
          <fieldset aria-describedby="categorie-aide categorie-erreur">
            <legend className="mb-1 text-[15px] font-bold">Catégorie</legend>
            <p id="categorie-aide" className="mb-2.5 text-[13.5px] text-gris">
              {quartierChoisi ? `Catégories proposées à ${quartierChoisi.nom}` : "Choisissez d'abord un quartier."}
            </p>
            <div id="categories" tabIndex={-1} className="flex flex-wrap gap-2">
              {categoriesDuQuartier.map((c) => {
                const actif = String(c.id) === categorieId;
                return (
                  <label
                    key={c.id}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full pr-3.5 pl-2.5 text-sm font-semibold whitespace-nowrap has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foret ${
                      actif ? "border-2" : "border border-trait bg-carte hover:border-foret"
                    }`}
                    style={actif ? { borderColor: c.couleur, backgroundColor: `${c.couleur}1f`, color: c.couleur } : undefined}
                  >
                    <input
                      type="radio"
                      name="categorieId"
                      value={c.id}
                      checked={actif}
                      onChange={(e) => {
                        setCategorieId(e.target.value);
                        setErreurs((er) => ({ ...er, categorieId: undefined }));
                      }}
                      className="sr-only"
                    />
                    <Icone nom={pictoCategorie(c.slug)} taille={17} />
                    {c.nom}
                  </label>
                );
              })}
            </div>
            <Erreur id="categorie-erreur" message={erreurs.categorieId} />
          </fieldset>

          <div className="mt-[22px] flex flex-col gap-2">
            <label htmlFor="saisie-tag" className="text-[15px] font-bold">
              Tags <span className="font-medium text-gris">(facultatif, {MAX_TAGS} maximum)</span>
            </label>
            <div className="flex min-h-[52px] flex-wrap items-center gap-1.5 rounded-[14px] border border-trait bg-carte px-2 py-1.5 focus-within:border-foret">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  aria-label={`Retirer le tag ${tag}`}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-foret/11 pr-2 pl-3 text-sm font-semibold whitespace-nowrap text-foret-fonce hover:bg-foret/20"
                >
                  #{tag}
                  <Icone nom="fermer" taille={15} />
                </button>
              ))}
              <input
                id="saisie-tag"
                value={saisieTag}
                onChange={(e) => setSaisieTag(e.target.value)}
                onKeyDown={toucheTag}
                onBlur={() => saisieTag && ajouterTag(saisieTag)}
                maxLength={30}
                disabled={tags.length >= MAX_TAGS}
                placeholder={tags.length >= MAX_TAGS ? "Maximum atteint" : "Ajouter un tag, puis Entrée"}
                aria-describedby="tags-erreur"
                className="h-9 min-w-[150px] flex-1 border-0 bg-transparent text-[15px] outline-none focus-visible:outline-none"
              />
            </div>
            {suggestionsTags.length > 0 && tags.length < MAX_TAGS && (
              <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-gris">
                Suggestions :
                {suggestionsTags.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ajouterTag(s)}
                    className="h-[34px] rounded-full border border-dashed border-[#cbbfa6] px-2.5 text-[13px] font-semibold whitespace-nowrap text-encre hover:border-foret"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
            <Erreur id="tags-erreur" message={erreurs.tags} />
          </div>

          <div className="mt-[22px] flex flex-col gap-2">
            <p className="text-[15px] font-bold">
              Photos et documents <span className="font-medium text-gris">(facultatif)</span>
            </p>
            <label
              htmlFor="fichiers"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[18px] border-2 border-dashed border-[#cbbfa6] bg-carte p-[18px] text-center hover:border-foret has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foret"
            >
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-foret/11 text-foret-fonce">
                <Icone nom="envoyer" taille={22} />
              </span>
              <span className="text-[15px] font-bold">Ajouter des fichiers</span>
              <span id="aide-fichiers" className="text-[13px] text-gris">
                PDF, PNG, JPG, WebP ou DOCX · {MAX_FICHIERS} fichiers, 5 Mo chacun
              </span>
              <input
                ref={champFichiers}
                id="fichiers"
                name="fichiers"
                type="file"
                multiple
                accept={EXTENSIONS_ACCEPTEES}
                onChange={choisirFichiers}
                aria-describedby="aide-fichiers fichiers-erreur"
                className="sr-only"
              />
            </label>
            {fichiers.length > 0 && (
              <ul className="flex flex-col gap-2">
                {fichiers.map((f) => (
                  <li key={f.name + f.size} className="flex items-center gap-2.5 rounded-[14px] border border-trait bg-carte p-2">
                    <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] bg-tomate-clair text-[11px] font-bold text-tomate-fonce">
                      {extension(f.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{f.name}</span>
                      <span className="text-[12.5px] text-gris">
                        {extension(f.name)} · {tailleLisible(f.size)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => definirFichiers(fichiers.filter((x) => x !== f))}
                      aria-label={`Retirer ${f.name}`}
                      className="flex size-11 items-center justify-center rounded-full text-gris hover:bg-sable/70"
                    >
                      <Icone nom="poubelle" taille={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Erreur id="fichiers-erreur" message={erreurs.fichiers} />
          </div>
        </div>

        {/* Étape 4 : relecture. */}
        <div hidden={etape !== 4}>
          <TitreEtape n={4} titre="Relisez avant de publier" sousTitre="Voici votre idée telle que vos voisins la verront." />
          <article className="flex flex-col gap-2.5 rounded-2xl border border-trait bg-carte px-4 py-3.5">
            {categorieChoisie && (
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-gris">
                <span
                  className="inline-flex items-center gap-[5px] rounded-full py-[3px] pr-2.5 pl-2 text-xs font-bold"
                  style={{ backgroundColor: `${categorieChoisie.couleur}1f`, color: categorieChoisie.couleur }}
                >
                  <Icone nom={pictoCategorie(categorieChoisie.slug)} taille={14} />
                  {categorieChoisie.nom}
                </span>
                {quartierChoisi && (
                  <span className="inline-flex items-center gap-[3px]">
                    <Icone nom="epingle" taille={13} />
                    {quartierChoisi.nom}
                  </span>
                )}
              </div>
            )}
            <p className="font-titre text-[19px] leading-[1.25] font-semibold">{titre.trim() || "Sans titre"}</p>
            <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-gris">{description}</p>
          </article>
          <dl className="mt-[18px] rounded-[18px] border border-trait bg-carte">
            {[
              { cle: "Quartier", val: quartierChoisi?.nom ?? "—", n: 2 },
              { cle: "Emplacement", val: position ? "Épingle placée sur la carte" : "Pas d'épingle", n: 2 },
              { cle: "Catégorie", val: categorieChoisie?.nom ?? "—", n: 3 },
              { cle: "Tags", val: tags.length ? tags.map((t) => `#${t}`).join("  ") : "Aucun", n: 3 },
              {
                cle: "Fichiers",
                val: fichiers.length ? `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""}` : "Aucun",
                n: 3,
              },
            ].map((r, i) => (
              <div key={r.cle} className={`flex items-center gap-2.5 py-2.5 pr-1.5 pl-3.5 ${i ? "border-t border-sable-clair" : ""}`}>
                <div className="min-w-0 flex-1">
                  <dt className="text-[12.5px] text-gris">{r.cle}</dt>
                  <dd className="mt-px truncate text-[14.5px] font-semibold">{r.val}</dd>
                </div>
                <button
                  type="button"
                  onClick={() => allerA(r.n)}
                  className="min-h-11 px-2.5 text-[13.5px] font-bold text-foret-fonce underline"
                >
                  Modifier<span className="sr-only"> : {r.cle}</span>
                </button>
              </div>
            ))}
          </dl>
          <p className="mt-3.5 text-[13.5px] leading-[1.45] text-gris">
            Publiée sous le pseudo <strong className="text-encre">{pseudo}</strong>. Vous suivrez ses soutiens dans Mon
            espace.
          </p>
        </div>
      </div>

      {/* Navigation entre les étapes : fixée en bas sur mobile. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-trait bg-carte px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
        <button
          type="button"
          onClick={() => allerA(etape - 1)}
          disabled={etape === 1}
          className="bouton-contour bouton-grand px-5 disabled:opacity-45"
        >
          <Icone nom="retour" taille={18} />
          Retour
        </button>
        <button type="submit" disabled={enCours} className="bouton-plein bouton-grand flex-1 lg:flex-none lg:px-8">
          {etape === 4 ? (enCours ? "Publication…" : "Publier mon idée") : "Continuer"}
          <Icone nom={etape === 4 ? "valider" : "fleche"} taille={18} epaisseur={2.4} />
        </button>
      </div>
    </form>
  );
}

function TitreEtape({ n, titre, sousTitre }: { n: number; titre: string; sousTitre: string }) {
  return (
    <div className="mb-[22px]">
      <h2 id={`titre-etape-${n}`} tabIndex={-1} className="font-titre text-[27px] leading-[1.12] font-semibold tracking-[-0.015em] outline-none lg:text-4xl">
        {titre}
      </h2>
      <p className="mt-1 text-[15px] leading-[1.45] text-gris">{sousTitre}</p>
    </div>
  );
}

function Erreur({ id, message }: { id?: string; message?: string }) {
  if (!message) return id ? <span id={id} hidden /> : null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-tomate">
      <Icone nom="alerte" taille={16} />
      {message}
    </p>
  );
}
