import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import ResidenceCard from "@/components/ResidenceCard";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; region: string }>;
}

function decodeRegion(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, region: slug } = await params;
  const t = await getTranslations({ locale, namespace: "region" });
  const region = decodeRegion(slug);
  return {
    title: t("metaTitle", { region }),
    description: t("metaDesc", { region }),
    alternates: {
      canonical: `https://place65plus.quebec${locale === "en" ? "/en" : ""}/residences/region/${slug}`,
      languages: {
        fr: `https://place65plus.quebec/residences/region/${slug}`,
        en: `https://place65plus.quebec/en/residences/region/${slug}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from("residences")
    .select("region")
    .not("region", "is", null);

  const regions = [...new Set((data ?? []).map((r) => r.region).filter(Boolean))];
  return regions.flatMap((region) => [
    { locale: "fr", region: encodeURIComponent(region!.toLowerCase().replace(/ /g, "-")) },
    { locale: "en", region: encodeURIComponent(region!.toLowerCase().replace(/ /g, "-")) },
  ]);
}

async function getResidencesRegion(region: string): Promise<Residence[]> {
  const { data } = await supabase
    .from("residences")
    .select("*")
    .ilike("region", `%${region}%`)
    .order("note_google", { ascending: false, nullsFirst: false })
    .limit(200);
  return data ?? [];
}

export default async function RegionPage({ params }: Props) {
  const { locale, region: slug } = await params;
  const t = await getTranslations({ locale, namespace: "region" });
  const tb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const region = decodeRegion(slug);
  const residences = await getResidencesRegion(region);

  if (residences.length === 0) notFound();

  // Group by city
  const byVille = residences.reduce<Record<string, Residence[]>>((acc, r) => {
    const v = r.ville ?? "Autres";
    if (!acc[v]) acc[v] = [];
    acc[v].push(r);
    return acc;
  }, {});

  const villes = Object.keys(byVille).sort();

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">{tb("home")}</Link>
          <span>›</span>
          <Link href="/recherche" className="hover:text-terracotta">{tb("residences")}</Link>
          <span>›</span>
          <span className="text-texte capitalize">{region}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-marine mb-2">
            {t("heading")}{" "}
            <span className="text-terracotta capitalize">{region}</span>
          </h1>
          <p className="text-gray-500">
            {t("count", { n: residences.length, cities: villes.length })}
          </p>
        </div>

        {/* Cities nav */}
        <div className="flex flex-wrap gap-2 mb-10">
          {villes.map((v) => (
            <Link
              key={v}
              href={`/residences/${encodeURIComponent(v.toLowerCase().replace(/ /g, "-"))}`}
              className="px-3 py-1.5 rounded-full bg-white border border-gris hover:border-terracotta text-sm text-marine transition-colors"
            >
              {v}{" "}
              <span className="text-gray-400 text-xs">({byVille[v].length})</span>
            </Link>
          ))}
        </div>

        {/* Top residences */}
        <h2 className="text-xl font-display font-semibold text-marine mb-5">
          {t("topRated")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {residences.slice(0, 12).map((r) => (
            <ResidenceCard key={r.id} residence={r} />
          ))}
        </div>

        {residences.length > 12 && (
          <div className="text-center">
            <Link
              href={`/recherche?region=${encodeURIComponent(region)}`}
              className="bg-marine hover:bg-marine-light text-creme font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {t("seeAll", { n: residences.length })}
            </Link>
          </div>
        )}
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-12">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
