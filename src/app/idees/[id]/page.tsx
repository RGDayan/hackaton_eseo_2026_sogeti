import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarteIdees } from "@/components/carte-lazy";
import { Commentaires } from "@/components/commentaires";
import { Favori, Partager } from "@/components/favori";
import { Icone } from "@/components/icone";
import { BadgeCategorie, IdeeLigne, VisuelCategorie } from "@/components/idee-card";
import { PanneauModeration } from "@/components/panneau-moderation";
import { AvisIdee } from "@/components/vote";
import { peutModerer } from "@/lib/droits";
import { dateFr, extension, monogramme, nomCourt, tailleLisible } from "@/lib/format";
import { getMesFavoris, getMesVotes, getSuggestion, listerCommentaires, listerProches } from "@/lib/queries";
import { getUtilisateur } from "@/lib/session";

export default function PageIdee({ params, searchParams }: PageProps<"/idees/[id]">) {
  return (
    <Suspense fallback={<SqueletteIdee />}>
      <Idee params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Idee({
  params,
  searchParams,
}: {
  params: PageProps<"/idees/[id]">["params"];
  searchParams: PageProps<"/idees/[id]">["searchParams"];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) notFound();

  const [idee, utilisateur, query] = await Promise.all([getSuggestion(id), getUtilisateur(), searchParams]);
  if (!idee) notFound();
  // Une idée masquée n'est visible que par la modération de sa ville.
  const moderable = peutModerer(utilisateur, idee.localisation.ville.slug);
  if (idee.masquee && !moderable) notFound();

  const [mesVotes, mesFavoris, commentaires, proches] = await Promise.all([
    getMesVotes(utilisateur?.id, [id]),
    getMesFavoris(utilisateur?.id, [id]),
    listerCommentaires(id),
    listerProches({
      id,
      categorieSlug: idee.categorie.slug,
      quartierSlug: idee.localisation.slug,
      villeSlug: idee.localisation.ville.slug,
    }),
  ]);
  const images = idee.piecesJointes.filter((p) => p.typeMime.startsWith("image/"));
  const documents = idee.piecesJointes.filter((p) => !p.typeMime.startsWith("image/"));
  const ville = idee.localisation.ville;
  const connecte = Boolean(utilisateur);
  const nouvelle = query.nouvelle === "1" && !idee.masquee;

  return (
    <article className="pb-6 lg:pt-6">
      {/* Visuel : première photo, sinon le picto de la catégorie. Pleine largeur sur mobile. */}
      <div className="relative -mx-4 h-[300px] overflow-hidden sm:mx-0 sm:mt-4 sm:rounded-[28px] lg:mt-0 lg:h-[360px]">
        {images[0] ? (
          // Fichier envoyé par un habitant, servi par notre route : next/image n'apporte rien ici.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/pieces-jointes/${images[0].id}`} alt={images[0].nomOriginal} className="size-full object-cover" />
        ) : (
          <VisuelCategorie categorie={idee.categorie} taille={96} />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/35 to-transparent" />
        <Link
          href="/#fil"
          aria-label="Retour aux idées"
          className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full bg-carte text-encre shadow-[0_2px_8px_rgb(0_0_0/0.15)]"
        >
          <Icone nom="retour" taille={20} />
        </Link>
        {images.length > 0 && (
          <span className="absolute top-3 right-3 flex h-11 items-center gap-1.5 rounded-full bg-encre/72 px-3.5 text-[13px] font-bold text-white">
            <Icone nom="image" taille={16} />
            {images.length} photo{images.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="relative -mx-4 -mt-[26px] rounded-t-[26px] bg-papier px-4 pt-5 sm:mx-0 sm:mt-0 sm:rounded-none sm:px-0 lg:pt-8">
        <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12">
          <header className="flex flex-col gap-2.5 lg:col-start-1 lg:row-start-1">
            {nouvelle && (
              <div role="status" className="mb-1 flex items-start gap-3 rounded-[20px] bg-soleil/25 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foret text-white">
                  <Icone nom="valider" taille={18} epaisseur={3} />
                </span>
                <p className="text-[14.5px] leading-normal">
                  <strong className="font-titre text-lg">Votre idée est en ligne !</strong>
                  <br />
                  Elle est visible par tous les habitants de {ville.nom}. Partagez-la pour réunir des soutiens.
                </p>
              </div>
            )}
            {idee.masquee && (
              <div role="status" className="flex items-start gap-2.5 rounded-2xl bg-tomate-clair px-3.5 py-3 text-sm leading-[1.4] text-[#8f2a16]">
                <Icone nom="masquer" taille={20} />
                <span>
                  <strong>Idée masquée : seuls les modérateurs la voient.</strong>
                  {idee.motifMasquage && (
                    <>
                      <br />
                      Motif : « {idee.motifMasquage} »{idee.masqueeLe && `, le ${dateFr(idee.masqueeLe)}`}.
                    </>
                  )}
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-gris">
              <BadgeCategorie {...idee.categorie} />
              <span className="inline-flex items-center gap-1">
                <Icone nom="epingle" taille={14} />
                {idee.localisation.nom}
              </span>
            </div>
            <h1 className="font-titre text-[29px] leading-[1.12] font-semibold tracking-[-0.015em] text-balance lg:text-5xl">
              {idee.titre}
            </h1>
            <div className="flex items-center gap-2.5 text-sm">
              <span aria-hidden className="flex size-[34px] items-center justify-center rounded-full bg-[#f3d9a4] font-bold">
                {monogramme(idee.auteur.nickname)}
              </span>
              <span>
                <strong>{idee.auteur.nickname}</strong>{" "}
                <span className="text-gris">· proposée le {dateFr(idee.createdAt)}</span>
              </span>
            </div>
          </header>

          {/* Avis et barre d'action : colonne de droite, collante, sur grand écran. */}
          <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <AvisIdee
              suggestionId={idee.id}
              pour={idee.votesPour}
              monVote={mesVotes[idee.id] ?? 0}
              connecte={connecte}
              actions={
                <>
                  <Favori
                    variante="rond"
                    suggestionId={idee.id}
                    estFavori={mesFavoris.has(idee.id)}
                    nombre={idee._count.favoris}
                    connecte={connecte}
                  />
                  <Partager titre={idee.titre} />
                </>
              }
            />
            {moderable && <PanneauModeration id={idee.id} masquee={idee.masquee} motif={idee.motifMasquage} />}
          </aside>

          <div className="flex min-w-0 flex-col gap-[18px] lg:col-start-1 lg:row-start-2 lg:gap-8">
            <section aria-labelledby="titre-desc" className="flex flex-col gap-2.5">
              <h2 id="titre-desc" className="titre-bloc">
                L&apos;idée
              </h2>
              <p className="text-base leading-relaxed break-words whitespace-pre-line text-pretty">{idee.description}</p>
              {idee.tags.length > 0 && (
                <ul className="mt-0.5 flex flex-wrap gap-2">
                  {idee.tags.map((tag) => (
                    <li key={tag.nom}>
                      <Link
                        href={`/?tag=${encodeURIComponent(tag.nom)}#fil`}
                        className="inline-flex min-h-9 items-center rounded-full bg-foret/9 px-3 text-sm font-semibold text-foret-fonce hover:bg-foret/15"
                      >
                        #{tag.nom}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {idee.piecesJointes.length > 0 && (
              <section aria-labelledby="titre-photos" className="flex flex-col gap-2.5">
                <h2 id="titre-photos" className="titre-bloc">
                  Photos et documents
                </h2>
                {images.length > 0 && (
                  <ul className={`grid gap-1.5 ${images.length > 1 ? "grid-cols-[2fr_1fr] auto-rows-[84px] sm:auto-rows-[120px]" : ""}`}>
                    {images.map((image, i) => (
                      <li
                        key={image.id}
                        className={`overflow-hidden rounded-[14px] bg-sable-clair ${
                          images.length > 1 && i === 0 ? "row-span-2" : ""
                        } ${images.length === 1 ? "h-56" : ""}`}
                      >
                        <a href={`/api/pieces-jointes/${image.id}`} target="_blank" rel="noreferrer" className="block size-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/pieces-jointes/${image.id}`}
                            alt={`${image.nomOriginal} (ouvrir en grand)`}
                            className="size-full object-cover transition-transform hover:scale-[1.02]"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {documents.length > 0 && (
                  <ul className="divide-y divide-sable-clair rounded-2xl border border-trait bg-carte">
                    {documents.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={`/api/pieces-jointes/${doc.id}`}
                          className="flex min-h-11 items-center gap-3 px-3.5 py-3 hover:text-foret-fonce"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-tomate-clair text-tomate-fonce">
                            <Icone nom="document" taille={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-semibold">{doc.nomOriginal}</span>
                            <span className="text-[13px] text-gris">
                              {extension(doc.nomOriginal)} · {tailleLisible(doc.taille)}
                            </span>
                          </span>
                          <Icone nom="envoyer" taille={18} className="rotate-180" />
                          <span className="sr-only">Télécharger</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <Link
              href={`/idees/${idee.id}/visite`}
              className="flex min-h-14 items-center gap-3 rounded-[18px] border border-trait bg-carte px-4 py-3 transition-colors hover:border-foret"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foret/12 text-foret-fonce">
                <Icone nom="carte" taille={20} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold">Visiter le terrain en 3D</span>
                <span className="text-[13px] text-gris">Une simulation de l&apos;idée, sur la photo aérienne du lieu</span>
              </span>
              <Icone nom="droite" taille={18} className="text-gris" />
            </Link>

            {idee.latitude !== null && idee.longitude !== null && (
              <section aria-labelledby="titre-lieu" className="flex flex-col gap-2.5">
                <h2 id="titre-lieu" className="titre-bloc">
                  Emplacement
                </h2>
                <div className="isolate h-[170px] overflow-hidden rounded-[18px] border border-trait lg:h-72">
                  <CarteIdees
                    centre={{ latitude: idee.latitude, longitude: idee.longitude }}
                    zoom={15}
                    epingles={[
                      {
                        id: idee.id,
                        titre: idee.titre,
                        latitude: idee.latitude,
                        longitude: idee.longitude,
                        votesPour: idee.votesPour,
                        categorie: idee.categorie.nom,
                        couleur: idee.categorie.couleur,
                      },
                    ]}
                  />
                </div>
                <Link
                  href={`/?quartier=${encodeURIComponent(idee.localisation.slug)}&vue=carte#fil`}
                  className="flex min-h-11 items-center gap-1.5 text-[14.5px] font-bold text-foret-fonce hover:underline"
                >
                  {idee.localisation.nom}, {nomCourt(ville.nom)} · Voir sur la carte
                  <Icone nom="fleche" taille={16} />
                </Link>
              </section>
            )}

            <Commentaires
              suggestionId={idee.id}
              total={idee._count.commentaires}
              commentaires={commentaires}
              userId={utilisateur?.id ?? null}
            />

            {proches.length > 0 && (
              <section aria-labelledby="titre-proches" className="flex flex-col gap-2.5">
                <h2 id="titre-proches" className="titre-bloc">
                  Idées proches
                </h2>
                <ul className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {proches.map((p) => (
                    <li key={p.id}>
                      <IdeeLigne idee={p} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SqueletteIdee() {
  return (
    <div aria-busy="true" aria-label="Chargement de l'idée" className="animate-pulse">
      <div className="-mx-4 h-[300px] bg-sable sm:mx-0 sm:mt-4 sm:rounded-[28px] lg:mt-6 lg:h-[360px]" />
      <div className="mt-5 flex flex-col gap-3">
        <span className="h-6 w-40 rounded-full bg-sable" />
        <span className="h-9 w-4/5 rounded-lg bg-sable" />
        <span className="h-32 rounded-[20px] bg-sable-clair" />
      </div>
    </div>
  );
}
