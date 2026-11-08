/*
 * Pictos Quartea : tracés Lucide simplifiés, repris de la maquette.
 * Composant sans état ni hook : utilisable côté serveur comme côté client.
 * Une forme qui commence par « c » est un cercle « cx,cy,r », sinon un chemin SVG.
 */
const TRACES = {
  velo: ["c5.5,17.5,3.5", "c18.5,17.5,3.5", "c15,5,1", "M12 17.5V14l-3-3 4-3 2 3h2"],
  feuille: [
    "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
    "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  ],
  livre: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  mains: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
    "M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66",
  ],
  goutte: [
    "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z",
  ],
  panier: ["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  ballon: [
    "c12,12,10",
    "M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94",
    "M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32",
    "M8.56 2.75c4.37 6 6 9.42 8 17.72",
  ],
  explorer: ["c12,12,10", "m16.24 7.76-1.8 5.41a2 2 0 0 1-1.27 1.27L7.76 16.24l1.8-5.41a2 2 0 0 1 1.27-1.27z"],
  carte: [
    "M14.1 5.55a2 2 0 0 0 1.8 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9l4.55-2.27a2 2 0 0 1 1.8 0z",
    "M15 5.76v15",
    "M9 3.24v15",
  ],
  plus: ["M5 12h14", "M12 5v14"],
  moi: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "c12,7,4"],
  connexion: ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "m10 17 5-5-5-5", "M15 12H3"],
  deconnexion: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  recherche: ["c11,11,8", "m21 21-4.3-4.3"],
  epingle: ["M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0", "c12,10,3"],
  pour: [
    "M7 10v12",
    "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
  ],
  contre: [
    "M17 14V2",
    "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",
  ],
  coeur: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  ],
  partager: ["c18,5,3", "c6,12,3", "c18,19,3", "M8.59 13.51 15.42 17.49", "M15.41 6.51 8.59 10.49"],
  commentaire: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  bas: ["m6 9 6 6 6-6"],
  droite: ["m9 18 6-6-6-6"],
  gauche: ["m15 18-6-6 6-6"],
  fleche: ["M5 12h14", "m12 5 7 7-7 7"],
  retour: ["m12 19-7-7 7-7", "M19 12H5"],
  changer: ["M8 3 4 7l4 4", "M4 7h16", "m16 21 4-4-4-4", "M20 17H4"],
  position: ["M2 12h3", "M19 12h3", "M12 2v3", "M12 19v3", "c12,12,7", "c12,12,3"],
  liste: ["M3 6h.01", "M3 12h.01", "M3 18h.01", "M8 6h13", "M8 12h13", "M8 18h13"],
  fermer: ["M18 6 6 18", "m6 6 12 12"],
  valider: ["M20 6 9 17l-5-5"],
  document: [
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
    "M14 2v4a2 2 0 0 0 2 2h4",
    "M10 9H8",
    "M16 13H8",
    "M16 17H8",
  ],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "c9,9,2",
    "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21",
  ],
  envoyer: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
  masquer: [
    "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",
    "M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",
    "M14.12 14.12a3 3 0 1 1-4.24-4.24",
    "m2 2 20 20",
  ],
  voir: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", "c12,12,3"],
  poubelle: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
  bouclier: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  reglages: [
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    "c12,12,3",
  ],
  graphique: ["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"],
  horloge: ["c12,12,10", "M12 6v6l4 2"],
  alerte: ["c12,12,10", "M12 8v4", "M12 16h.01"],
  info: ["c12,12,10", "M12 16v-4", "M12 8h.01"],
  etoile: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z"],
  lien: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  etincelle: [
    "M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z",
  ],
  crayon: [
    "M21.17 6.81a2.83 2.83 0 0 0-4-4L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z",
  ],
} as const;

export type NomIcone = keyof typeof TRACES;

type Props = {
  nom: NomIcone;
  taille?: number;
  plein?: boolean;
  epaisseur?: number;
  className?: string;
};

/** Picto décoratif (aria-hidden) : le texte accessible est porté par l'élément parent. */
export function Icone({ nom, taille = 20, plein = false, epaisseur = 2, className }: Props) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill={plein ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className ?? ""}`}
    >
      {TRACES[nom].map((d) => {
        if (d[0] === "c") {
          const [cx, cy, r] = d.slice(1).split(",");
          return <circle key={d} cx={cx} cy={cy} r={r} />;
        }
        return <path key={d} d={d} />;
      })}
    </svg>
  );
}

/** Picto associé à une catégorie, d'après son slug. Une catégorie créée dans l'admin prend l'étincelle. */
const PICTOS_CATEGORIES: Record<string, NomIcone> = {
  mobilite: "velo",
  "espaces-verts": "feuille",
  culture: "livre",
  solidarite: "mains",
  proprete: "goutte",
  commerces: "panier",
  "sport-loisirs": "ballon",
};

export function pictoCategorie(slug: string): NomIcone {
  return PICTOS_CATEGORIES[slug] ?? "etincelle";
}
