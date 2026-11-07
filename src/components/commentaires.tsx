import Link from "next/link";
import { FormulaireCommentaire } from "@/components/formulaire-commentaire";
import { SupprimerCommentaire } from "@/components/supprimer-commentaire";
import type { CommentaireListe } from "@/lib/queries";

const formatDateHeure = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

type Props = {
  suggestionId: number;
  total: number;
  commentaires: CommentaireListe[];
  /** Identifiant de l'utilisateur connecté, ou null. */
  userId: number | null;
};

export function Commentaires({ suggestionId, total, commentaires, userId }: Props) {
  return (
    <section id="commentaires" className="mt-8 scroll-mt-24">
      <h2 className="mb-3 font-titre text-lg font-semibold">Commentaires ({total})</h2>

      <div className="rounded-2xl border border-trait bg-carte p-5">
        {userId ? (
          <FormulaireCommentaire suggestionId={suggestionId} />
        ) : (
          <p className="text-sm text-gris">
            <Link
              href={`/connexion?next=${encodeURIComponent(`/idees/${suggestionId}`)}`}
              className="font-semibold text-foret hover:underline"
            >
              Choisissez un pseudo
            </Link>{" "}
            pour commenter cette idée.
          </p>
        )}
      </div>

      {commentaires.length === 0 ? (
        <p className="mt-4 text-sm text-gris">Aucun commentaire pour l&apos;instant. Lancez la discussion.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {commentaires.map((c) => {
            const estMien = c.auteur.id === userId;
            return (
              <li key={c.id} className="rounded-2xl border border-trait bg-carte p-4">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-semibold">{c.auteur.nickname}</span>
                  {estMien && <span className="text-xs text-foret">(vous)</span>}
                  <span className="text-xs text-gris">{formatDateHeure.format(c.createdAt)}</span>
                  {estMien && <SupprimerCommentaire commentaireId={c.id} />}
                </div>
                <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line">{c.contenu}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
