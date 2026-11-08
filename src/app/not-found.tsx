import { PageSysteme } from "@/components/page-systeme";

export default function Introuvable() {
  return (
    <PageSysteme
      grand="404"
      titre="Cette page n'existe pas ou a été retirée"
      texte="Le lien est peut-être incomplet, ou l'idée a été masquée par la modération."
      actions={[
        { href: "/", libelle: "Explorer les idées" },
        { href: "/idees/nouvelle", libelle: "Proposer une idée" },
      ]}
    />
  );
}
