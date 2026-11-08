import Link from "next/link";
import { FormulaireCommentaire } from "@/components/formulaire-commentaire";
import { Icone } from "@/components/icone";
import { SupprimerCommentaire } from "@/components/supprimer-commentaire";
import { monogramme } from "@/lib/format";
import type { CommentaireListe } from "@/lib/queries";

const formatDateHeure = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** Teintes douces des pastilles d'initiale, choisies d'après le pseudo pour rester stables. */
const TEINTES = ["#f3d9a4", "#cfe0c5", "#d8d0ee", "#f6d2c4", "#cde3ea"];
const teinte = (pseudo: string) => TEINTES[[...pseudo].reduce((s, c) => s + c.charCodeAt(0), 0) % TEINTES.length];

type Props = {
  suggestionId: number;
  total: number;
  commentaires: CommentaireListe[];
  /** Identifiant de l'utilisateur connecté, ou null. */
  userId: number | null;
};

export function Commentaires({ suggestionId, total, commentaires, userId }: Props) {
  const retour = encodeURIComponent(`/idees/${suggestionId}#commentaires`);

  return (
    <section id="commentaires" aria-labelledby="titre-com" className="flex scroll-mt-24 flex-col gap-3">
      <h2 id="titre-com" className="titre-bloc">
        Commentaires ({total})
      </h2>

      {userId ? (
        <FormulaireCommentaire suggestionId={suggestionId} />
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-trait-fonce bg-carte p-3.5">
          <span className="text-foret-fonce">
            <Icone nom="commentaire" taille={22} />
          </span>
          <p className="flex-1 text-sm leading-[1.4]">
            <a href={`/auth/login?inscription=1&next=${retour}`} className="font-bold text-foret-fonce underline">
              Créez un compte
            </a>{" "}
            ou{" "}
            <Link href={`/connexion?next=${retour}`} className="font-bold text-foret-fonce underline">
              connectez-vous
            </Link>{" "}
            pour rejoindre la discussion.
          </p>
        </div>
      )}

      {commentaires.length === 0 ? (
        <p className="text-sm text-gris">Aucun commentaire pour l&apos;instant. Lancez la discussion.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {commentaires.map((c) => {
            const estMien = c.auteur.id === userId;
            return (
              <li key={c.id} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: teinte(c.auteur.nickname) }}
                >
                  {monogramme(c.auteur.nickname)}
                </span>
                <div className="min-w-0 flex-1 rounded-[4px_16px_16px_16px] border border-trait bg-carte px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
                    <strong className="text-sm">{c.auteur.nickname}</strong>
                    {estMien && <span className="text-xs font-bold text-foret-fonce">(vous)</span>}
                    <span className="text-gris">{formatDateHeure.format(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[14.5px] leading-normal break-words whitespace-pre-line">{c.contenu}</p>
                  {estMien && <SupprimerCommentaire commentaireId={c.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
