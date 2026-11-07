import { z } from "zod";
import { CONTRASTE_MIN, FOND_CARTE, HEX, contrasteSuffisant, ratioContraste } from "@/lib/contraste";

export const MAX_TAGS = 5;
export const MAX_FICHIERS = 3;
export const TAILLE_MAX_FICHIER = 5 * 1024 * 1024;
export const EXTENSIONS_ACCEPTEES = ".pdf,.png,.jpg,.jpeg,.webp,.docx";

const schemaTag = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Un tag doit faire au moins 2 caractères.")
  .max(30, "Un tag doit faire au plus 30 caractères.");

const coordonnee = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

export const schemaSuggestion = z
  .object({
    titre: z
      .string({ error: "Donnez un titre à votre idée." })
      .trim()
      .min(5, "Le titre doit faire au moins 5 caractères.")
      .max(120, "Le titre doit faire au plus 120 caractères."),
    description: z
      .string({ error: "Décrivez votre idée." })
      .trim()
      .min(20, "Décrivez votre idée en 20 caractères au moins.")
      .max(3000, "La description doit faire au plus 3000 caractères."),
    categorieId: z.coerce.number().int().positive("Choisissez une catégorie."),
    localisationId: z.coerce.number().int().positive("Choisissez un quartier."),
    tags: z.array(schemaTag).max(MAX_TAGS, `${MAX_TAGS} tags maximum.`),
    latitude: coordonnee(-90, 90),
    longitude: coordonnee(-180, 180),
  })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    path: ["latitude"],
    message: "La position sur la carte est incomplète.",
  });

type ChampSuggestion = "titre" | "description" | "categorieId" | "localisationId" | "tags" | "fichiers" | "latitude";

export type EtatSuggestion = {
  /** Identifiant de l'idée créée, présent uniquement en cas de succès. */
  id?: number;
  erreurs?: Partial<Record<ChampSuggestion, string>>;
  erreur?: string;
};

/** N'accepte que les chemins internes : évite une redirection vers un site tiers après connexion. */
export function cheminSur(valeur: unknown): string {
  if (typeof valeur !== "string") return "/";
  if (!valeur.startsWith("/") || valeur.startsWith("//") || valeur.includes("\\")) return "/";
  return valeur;
}

export const schemaMotif = z
  .string({ error: "Indiquez le motif du masquage." })
  .trim()
  .min(3, "Le motif doit faire au moins 3 caractères.")
  .max(300, "Le motif doit faire au plus 300 caractères.");

// ——— Administration ———

/** « Fontaine d'Ouche » → « fontaine-d-ouche » */
export function slugifier(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const schemaSlug = z
  .string()
  .regex(/^[a-z0-9-]{2,60}$/, "Identifiant d'URL : 2 à 60 caractères, lettres minuscules, chiffres et tirets.");

const nombre = (min: number, max: number, message: string) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number(message).min(min, message).max(max, message));

const couleur = z.string().regex(HEX, "Couleur attendue au format #rrggbb.");

/** Couleur de la charte : texte sur le fond papier et fond des boutons à texte blanc (≥ 4,5:1). */
const couleurLisible = couleur.refine(contrasteSuffisant, {
  message: `Contraste insuffisant : il faut au moins ${CONTRASTE_MIN}:1 sur le fond de page et avec un texte blanc.`,
});

export const schemaVille = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(80, "80 caractères maximum."),
  slug: schemaSlug,
  latitude: nombre(-90, 90, "Latitude entre -90 et 90."),
  longitude: nombre(-180, 180, "Longitude entre -180 et 180."),
  zoom: nombre(3, 18, "Zoom entre 3 et 18.").pipe(z.number().int("Zoom entier.")),
  couleurPrincipale: couleurLisible,
  couleurPrincipaleFoncee: couleurLisible,
  couleurAccent: couleur,
  logoUrl: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.url({ protocol: /^https?$/, error: "Adresse du logo invalide (http ou https)." }).max(500).optional(),
  ),
});

export const schemaQuartier = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(80, "80 caractères maximum."),
  slug: schemaSlug,
  latitude: nombre(-90, 90, "Latitude entre -90 et 90."),
  longitude: nombre(-180, 180, "Longitude entre -180 et 180."),
});

export const schemaCategorie = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(60, "60 caractères maximum."),
  slug: schemaSlug,
  // Couleur du texte des badges, sur le fond des cartes.
  couleur: couleur.refine((c) => ratioContraste(c, FOND_CARTE) >= CONTRASTE_MIN, {
    message: `Contraste insuffisant : il faut au moins ${CONTRASTE_MIN}:1 sur le fond des cartes.`,
  }),
});

export type EtatAdmin = { erreur?: string; ok?: string };
