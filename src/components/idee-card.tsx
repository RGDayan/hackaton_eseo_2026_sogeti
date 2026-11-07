import Link from "next/link";
import { Favori } from "@/components/favori";
import { Vote } from "@/components/vote";
import type { SuggestionListee } from "@/lib/queries";

const formatDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function dateFr(date: Date) {
  return formatDate.format(date);
}

export function BadgeCategorie({ nom, couleur }: { nom: string; couleur: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${couleur}1f`, color: couleur }}
    >
      {nom}
    </span>
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

export function IdeeCard({ idee, monVote, connecte, estFavori, afficherVille = false }: Props) {
  const nbPieces = idee._count.piecesJointes;
  const nbCommentaires = idee._count.commentaires;

  return (
    <article className="rounded-2xl border border-trait bg-carte p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gris">
        <BadgeCategorie nom={idee.categorie.nom} couleur={idee.categorie.couleur} />
        <span>
          {idee.localisation.nom}
          {afficherVille && `, ${idee.localisation.ville.nom}`}
        </span>
        <span className="ml-auto">
          <Favori suggestionId={idee.id} estFavori={estFavori} nombre={idee._count.favoris} connecte={connecte} />
        </span>
      </div>

      <h2 className="mt-2.5 font-titre text-xl leading-snug font-semibold">
        <Link href={`/idees/${idee.id}`} className="hover:text-foret hover:underline">
          {idee.titre}
        </Link>
      </h2>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gris">{idee.description}</p>

      {idee.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {idee.tags.map((tag) => (
            <li key={tag.nom}>
              <Link href={`/?tag=${encodeURIComponent(tag.nom)}`} className="text-foret hover:underline">
                #{tag.nom}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Vote
          suggestionId={idee.id}
          pour={idee.votesPour}
          contre={idee.votesContre}
          monVote={monVote}
          connecte={connecte}
        />
      </div>

      <p className="mt-3 text-xs text-gris">
        Par {idee.auteur.nickname}, le {dateFr(idee.createdAt)}
        {nbPieces > 0 && ` · ${nbPieces} document${nbPieces > 1 ? "s" : ""}`}
        {nbCommentaires > 0 && ` · ${nbCommentaires} commentaire${nbCommentaires > 1 ? "s" : ""}`}
      </p>
    </article>
  );
}
