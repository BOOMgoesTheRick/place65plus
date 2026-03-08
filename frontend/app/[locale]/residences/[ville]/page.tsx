import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import ResidenceCard from "@/components/ResidenceCard";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; ville: string }>;
}

function decodeVille(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, ville: slug } = await params;
  const t = await getTranslations({ locale, namespace: "ville" });
  const ville = decodeVille(slug);
  return {
    title: t("metaTitle", { ville }),
    description: t("metaDesc", { ville }),
    alternates: {
      canonical: `https://place65plus.quebec${locale === "en" ? "/en" : ""}/residences/${slug}`,
      languages: {
        fr: `https://place65plus.quebec/residences/${slug}`,
        en: `https://place65plus.quebec/en/residences/${slug}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from("residences")
    .select("ville")
    .not("ville", "is", null);

  const villes = [...new Set((data ?? []).map((r) => r.ville).filter(Boolean))];
  return villes.flatMap((ville) => [
    { locale: "fr", ville: encodeURIComponent(ville!.toLowerCase().replace(/ /g, "-")) },
    { locale: "en", ville: encodeURIComponent(ville!.toLowerCase().replace(/ /g, "-")) },
  ]);
}

async function getResidencesVille(ville: string): Promise<Residence[]> {
  const { data } = await supabase
    .from("residences")
    .select("*")
    .ilike("ville", ville)
    .order("note_google", { ascending: false, nullsFirst: false })
    .limit(100);
  return data ?? [];
}

export default async function VillePage({ params }: Props) {
  const { locale, ville: slug } = await params;
  const t = await getTranslations({ locale, namespace: "ville" });
  const tb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const ville = decodeVille(slug);
  const residences = await getResidencesVille(ville);

  if (residences.length === 0) notFound();

  const region = residences[0]?.region;

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://place65plus.quebec" },
      ...(region ? [{ "@type": "ListItem", position: 2, name: region, item: `https://place65plus.quebec/residences/region/${encodeURIComponent(region.toLowerCase().replace(/ /g, "-"))}` }] : []),
      { "@type": "ListItem", position: region ? 3 : 2, name: ville, item: `https://place65plus.quebec/residences/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">{tb("home")}</Link>
          <span>›</span>
          {region && (
            <>
              <Link
                href={`/residences/region/${encodeURIComponent(region.toLowerCase().replace(/ /g, "-"))}`}
                className="hover:text-terracotta"
              >
                {region}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-texte capitalize">{ville}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-marine mb-2">
            {t("heading")}{" "}
            <span className="text-terracotta capitalize">{ville}</span>
          </h1>
          <p className="text-gray-500">
            {residences.length === 1
              ? t("count", { n: residences.length })
              : t("countPlural", { n: residences.length })}
            {region ? t("inRegion", { region }) : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {residences.map((r) => (
            <ResidenceCard key={r.id} residence={r} />
          ))}
        </div>

        <div className="mt-12 bg-gris rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-3">
            {t("searchOtherCity")}
          </p>
          <Link
            href="/recherche"
            className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {t("seeAll")}
          </Link>
        </div>
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-8">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
    </>
  );
}
