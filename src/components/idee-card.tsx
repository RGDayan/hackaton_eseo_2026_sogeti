import Link from "next/link";
import { Favori } from "@/components/favori";
import { Icone, pictoCategorie } from "@/components/icone";
import { Vote } from "@/components/vote";
import { monogramme, pourcentagePour } from "@/lib/format";
import type { SuggestionListee } from "@/lib/queries";

export { dateFr } from "@/lib/format";

type Categorie = { nom: string; couleur: string; slug?: string };

/** Badge de catégorie : texte de la couleur de la catégorie (contraste vérifié à la saisie) sur un fond teinté. */
export function BadgeCategorie({ nom, couleur, slug, fond }: Categorie & { fond?: string }) {
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full py-[3px] pr-2.5 pl-2 text-xs font-bold"
      style={{ backgroundColor: fond ?? `${couleur}1f`, color: couleur }}
    >
      {slug && <Icone nom={pictoCategorie(slug)} taille={14} />}
      {nom}
    </span>
  );
}

const urlPhoto = (idee: SuggestionListee) =>
  idee.piecesJointes[0] ? `/api/pieces-jointes/${idee.piecesJointes[0].id}` : null;

/** Visuel d'une idée sans photo : le picto de sa catégorie sur un fond teinté, avec deux formes décoratives. */
export function VisuelCategorie({ categorie, taille = 46 }: { categorie: Categorie; taille?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: `${categorie.couleur}1f`, color: categorie.couleur }}
    >
      <span className="absolute -top-12 -right-10 size-[150px] rounded-full border-[16px] border-current opacity-[0.08]" />
      <span className="absolute -bottom-3.5 left-[22px] size-[60px] rounded-full bg-soleil opacity-55" />
      <Icone nom={pictoCategorie(categorie.slug ?? "")} taille={taille} epaisseur={1.6} />
    </div>
  );
}

type Props = {
  idee: SuggestionListee;
  monVote: number;
  connecte: boolean;
  estFavori: boolean;
  /** Affiche aussi la ville (listes qui mélangent plusieurs villes, comme les favoris). */
  afficherVille?: boolean;
};

/** Carte standard du fil : photo éventuelle, catégorie, quartier, titre, jauge de soutien et vote. */
export function IdeeCard({ idee, monVote, connecte, estFavori, afficherVille = false }: Props) {
  const photo = urlPhoto(idee);
  const nbCommentaires = idee._count.commentaires;

  return (
    <article className="overflow-hidden rounded-2xl border border-trait bg-carte shadow-[0_1px_2px_rgb(28_43_36/0.05),0_4px_14px_rgb(28_43_36/0.04)]">
      {photo && (
        <div className="relative h-[172px] bg-sable-clair">
          {/* Fichier envoyé par un habitant, servi par notre route : next/image n'apporte rien ici. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-gris">
          <BadgeCategorie {...idee.categorie} />
          <span className="inline-flex items-center gap-[3px]">
            <Icone nom="epingle" taille={13} />
            {idee.localisation.nom}
            {afficherVille && `, ${idee.localisation.ville.nom}`}
          </span>
        </div>
        <h3 className="font-titre text-[19px] leading-[1.25] font-semibold tracking-[-0.01em] text-pretty">
          <Link href={`/idees/${idee.id}`} className="hover:text-foret-fonce hover:underline">
            {idee.titre}
          </Link>
        </h3>
        <Vote
          suggestionId={idee.id}
          pour={idee.votesPour}
          contre={idee.votesContre}
          monVote={monVote}
          connecte={connecte}
        >
          <Link
            href={`/idees/${idee.id}#commentaires`}
            aria-label={`${nbCommentaires} commentaire${nbCommentaires > 1 ? "s" : ""}`}
            className="ml-auto inline-flex min-h-11 items-center gap-1 px-1.5 text-[13px] text-gris hover:text-encre"
          >
            <Icone nom="commentaire" taille={16} />
            {nbCommentaires}
          </Link>
          <Favori suggestionId={idee.id} estFavori={estFavori} nombre={idee._count.favoris} connecte={connecte} />
        </Vote>
      </div>
    </article>
  );
}

/** Carte compacte du carrousel « En ce moment ». */
export function IdeeCompacte({ idee, rang }: { idee: SuggestionListee; rang?: number }) {
  const photo = urlPhoto(idee);
  const pct = pourcentagePour(idee.votesPour, idee.votesContre);

  return (
    <article className="relative w-[236px] shrink-0 overflow-hidden rounded-2xl border border-trait bg-carte shadow-[0_1px_2px_rgb(28_43_36/0.05),0_4px_14px_rgb(28_43_36/0.04)] lg:w-[260px]">
      <div className="relative h-32">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <VisuelCategorie categorie={idee.categorie} />
        )}
        <span className="absolute top-2.5 left-2.5">
          <BadgeCategorie {...idee.categorie} fond="var(--color-carte)" />
        </span>
        {rang !== undefined && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-encre px-2 py-[3px] text-xs font-bold text-white">
            <span className="sr-only">Rang </span>#{rang}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-3.5 pt-3 pb-3.5">
        <h3 className="line-clamp-2 h-10 font-titre text-base leading-[1.25] font-semibold">
          {/* Lien étiré : toute la carte est cliquable. */}
          <Link href={`/idees/${idee.id}`} className="after:absolute after:inset-0 hover:underline">
            {idee.titre}
          </Link>
        </h3>
        <p className="text-[12.5px] text-gris">{idee.localisation.nom}</p>
        <div className="flex items-center gap-2">
          <div aria-hidden className="h-[5px] flex-1 overflow-hidden rounded-full bg-sable">
            <div className="h-full bg-foret" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12.5px] font-bold whitespace-nowrap">
            {idee.votesPour} soutien{idee.votesPour > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </article>
  );
}

type PropsLigne = {
  idee: SuggestionListee;
  /** Pastille « Pour » ou « Contre » : mon vote, dans Mon espace. */
  monVote?: number;
  afficherVille?: boolean;
};

/** Carte en ligne : idées proches, Mon espace, aperçu sur la carte. */
export function IdeeLigne({ idee, monVote, afficherVille = false }: PropsLigne) {
  const photo = urlPhoto(idee);
  const pct = pourcentagePour(idee.votesPour, idee.votesContre);

  return (
    <div className="flex flex-col gap-[5px]">
      {afficherVille && (
        <span className="inline-flex items-center gap-1.5 pl-1 text-[12.5px] font-bold">
          <span
            aria-hidden
            className="size-[18px] rounded-md text-center font-titre text-[11px] leading-[18px] font-semibold text-white"
            style={{ backgroundColor: idee.localisation.ville.couleurPrincipale }}
          >
            {monogramme(idee.localisation.ville.nom)}
          </span>
          {idee.localisation.ville.nom}
        </span>
      )}
      <Link
        href={`/idees/${idee.id}`}
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-trait bg-carte py-2.5 pr-1 pl-2.5 transition-colors hover:border-foret"
      >
        <span className="relative flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-xl">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <span
              aria-hidden
              className="flex size-full items-center justify-center"
              style={{ backgroundColor: `${idee.categorie.couleur}1f`, color: idee.categorie.couleur }}
            >
              <Icone nom={pictoCategorie(idee.categorie.slug)} taille={26} />
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex flex-wrap items-center gap-x-1.5 text-xs font-bold" style={{ color: idee.categorie.couleur }}>
            {idee.categorie.nom}
            <span className="font-medium text-gris">· {idee.localisation.nom}</span>
            {monVote !== undefined && monVote !== 0 && (
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-[3px] ${
                  monVote === 1 ? "bg-foret/12 text-foret-fonce" : "bg-encre text-white"
                }`}
              >
                <Icone nom={monVote === 1 ? "pour" : "contre"} taille={13} />
                {monVote === 1 ? "Pour" : "Contre"}
              </span>
            )}
          </span>
          <span className="line-clamp-2 font-titre text-[15px] leading-[1.25] font-semibold">{idee.titre}</span>
          <span className="text-[12.5px] text-gris">
            <strong className="text-encre">{idee.votesPour}</strong> pour · {idee.votesContre} contre · {pct} %
          </span>
        </span>
        <span className="px-1.5 text-gris">
          <Icone nom="droite" taille={18} />
        </span>
      </Link>
    </div>
  );
}
