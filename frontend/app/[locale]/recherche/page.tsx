import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ResidenceCard from "@/components/ResidenceCard";
import FilterBar from "@/components/FilterBar";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; region?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "search" });
  const q = sp.q;
  const region = sp.region;
  const suffix =
    q
      ? locale === "fr"
        ? ` à ${q}`
        : ` in ${q}`
      : region
      ? locale === "fr"
        ? ` en ${region}`
        : ` in ${region}`
      : locale === "fr"
      ? " au Québec"
      : " in Quebec";
  const title =
    locale === "fr"
      ? `Résidences pour aînés${suffix}`
      : `Senior residences${suffix}`;
  const description =
    locale === "fr"
      ? `Trouvez une résidence pour aînés${suffix}. Filtrez par région, catégorie MSSS et note Google. Plus de 3 600 RPAs répertoriées.`
      : `Find a senior residence${suffix}. Filter by region, MSSS category and Google rating. Over 3,600 listed RPAs.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://place65plus.quebec${locale === "en" ? "/en" : ""}/recherche`,
      languages: {
        fr: "https://place65plus.quebec/recherche",
        en: "https://place65plus.quebec/en/recherche",
      },
    },
  };
}

const PAGE_SIZE = 24;

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    region?: string;
    categorie?: string;
    note?: string;
    page?: string;
  }>;
}

function normalizeQuery(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function expandCityQuery(q: string): string[] {
  const variants = [q];
  const lower = q.toLowerCase();
  // "st-X" → essaie aussi "saint-X"
  if (lower.startsWith("st-") || lower.startsWith("st ")) {
    variants.push("saint-" + q.slice(3));
    variants.push("saint " + q.slice(3));
  }
  // "ste-X" → essaie aussi "sainte-X"
  if (lower.startsWith("ste-") || lower.startsWith("ste ")) {
    variants.push("sainte-" + q.slice(4));
    variants.push("sainte " + q.slice(4));
  }
  return variants;
}

async function geocodeCity(query: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + " Québec Canada")}&key=${key}`
    );
    const json = await res.json();
    if (json.status === "OK" && json.results.length > 0) {
      const loc = json.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch { /* ignore */ }
  return null;
}

async function getNearbyIds(cityQuery: string): Promise<number[] | null> {
  // 1. Essayer via les villes connues dans la DB (rapide, sans API)
  const variants = expandCityQuery(cityQuery);
  for (const variant of variants) {
    const { data } = await supabase.rpc("residences_near_city", {
      city_query: variant,
      radius_km: 30,
    });
    if (data && data.length > 0) {
      return (data as { id: number }[]).map((r) => r.id);
    }
  }
  // 2. Fallback : géocoder via Google Maps et chercher par coordonnées
  const coords = await geocodeCity(cityQuery);
  if (!coords) return null;
  const { data } = await supabase.rpc("residences_near_point", {
    lat: coords.lat,
    lng: coords.lng,
    radius_km: 30,
  });
  if (data && data.length > 0) {
    return (data as { id: number }[]).map((r) => r.id);
  }
  return null;
}

async function getResidences(
  q: string,
  region: string,
  categorie: string,
  note: string,
  page: number
): Promise<{ data: Residence[]; count: number }> {
  let query = supabase.from("residences").select("*", { count: "exact" });

  if (q) {
    const nearbyIds = await getNearbyIds(q);
    if (nearbyIds) {
      query = query.in("id", nearbyIds);
    } else {
      const qn = normalizeQuery(q);
      query = query.or(`nom_search.ilike.%${qn}%,ville_search.ilike.%${qn}%,region_search.ilike.%${qn}%`);
    }
  }
  if (region) {
    query = query.ilike("region_search", `%${normalizeQuery(region)}%`);
  }
  if (categorie) {
    query = query.ilike("categorie", `%${categorie}%`);
  }
  if (note) {
    query = query.gte("note_google", parseFloat(note));
  }

  query = query
    .order("quality_score", { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) console.error("Supabase error:", error);
  return { data: data ?? [], count: count ?? 0 };
}

export default async function RecherchePage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "search" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const q = sp.q ?? "";
  const region = sp.region ?? "";
  const categorie = sp.categorie ?? "";
  const note = sp.note ?? "";
  const page = parseInt(sp.page ?? "1", 10);
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  const { data: residences, count } = await getResidences(q, region, categorie, note, page);
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams();
    if (q) urlParams.set("q", q);
    if (region) urlParams.set("region", region);
    if (categorie) urlParams.set("categorie", categorie);
    if (note) urlParams.set("note", note);
    if (p > 1) urlParams.set("page", String(p));
    return `/recherche?${urlParams.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="bg-white border-b border-gris sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <SearchBar defaultValue={q} />
          <FilterBar currentRegion={region} currentCategorie={categorie} currentRating={note} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-marine">
              {count === 0
                ? t("noResults")
                : count === 1
                ? t("resultCount", { count: count.toLocaleString(lcLocale) })
                : t("resultCountPlural", { count: count.toLocaleString(lcLocale) })}
            </h1>
            {(q || region || categorie || note) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {q && t("filterFor", { q })}
                {region && ` · ${region}`}
                {categorie && ` · ${t("filterCategory", { cat: categorie })}`}
                {note && ` · ${t("filterRating", { note })}`}
              </p>
            )}
          </div>
          <Link
            href="/carte"
            className="text-sm text-marine hover:text-marine-light font-medium hidden md:flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            {t("viewOnMap")}
          </Link>
        </div>

        {residences.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {residences.map((r) => (
              <ResidenceCard key={r.id} residence={r} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-display font-semibold text-marine mb-2">
              {t("noResidenceFound")}
            </h2>
            <p className="text-gray-500 mb-6">{t("noResidenceSuggestion")}</p>
            <Link
              href="/recherche"
              className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {t("seeAll")}
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-4 py-2 rounded-lg border border-gris bg-white hover:border-terracotta text-sm font-medium text-texte"
              >
                {t("prev")}
              </Link>
            )}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-terracotta text-white"
                        : "border border-gris bg-white hover:border-terracotta text-texte"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 rounded-lg border border-gris bg-white hover:border-terracotta text-sm font-medium text-texte"
              >
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-16">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
