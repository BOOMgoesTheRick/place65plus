import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import { Link } from "@/i18n/navigation";
import React from "react";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
}

async function getResidences(ids: number[]): Promise<Residence[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("residences")
    .select("*")
    .in("id", ids);
  return data ?? [];
}

function Row({ label, values }: { label: string; values: (React.ReactNode)[] }) {
  return (
    <tr className="border-b border-gris">
      <td className="py-3 pr-4 text-sm text-gray-400 font-medium w-32 shrink-0 align-top">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-4 text-sm text-texte align-top">
          {v ?? <span className="text-gray-300">—</span>}
        </td>
      ))}
    </tr>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-or font-semibold">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))} {rating.toFixed(1)}
    </span>
  );
}

export default async function ComparerPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "compare" });
  const tb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const ids = (sp.ids ?? "")
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
    .slice(0, 3);

  const residences = await getResidences(ids);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">{tb("home")}</Link>
          <span>›</span>
          <span className="text-texte">{tb("compare")}</span>
        </nav>

        <h1 className="text-3xl font-display font-bold text-marine mb-8">
          {t("title")}
        </h1>

        {residences.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-xl font-display font-semibold text-marine mb-2">
              {t("empty")}
            </h2>
            <p className="text-gray-500 mb-6">
              {t("emptyDesc")}
            </p>
            <Link
              href="/recherche"
              className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {t("doSearch")}
            </Link>
          </div>
        ) : (
          <>
            {/* Photos header */}
            <div className="grid gap-4 mb-8"
              style={{ gridTemplateColumns: `8rem repeat(${residences.length}, 1fr)` }}
            >
              <div />
              {residences.map((r) => (
                <div key={r.id} className="text-center">
                  <div className="h-32 rounded-xl overflow-hidden bg-gris mb-3">
                    {r.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo_url} alt={r.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
                    )}
                  </div>
                  <Link
                    href={`/residence/${r.id}`}
                    className="font-display font-semibold text-marine text-sm hover:text-terracotta leading-tight block"
                  >
                    {r.nom}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{r.ville}</p>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-2xl border border-gris overflow-hidden">
              <table className="w-full">
                <tbody>
                  <Row label={t("labelRating")} values={residences.map((r) => r.note_google ? <Stars key={r.id} rating={r.note_google} /> : null)} />
                  <Row label={t("labelReviews")} values={residences.map((r) => r.nb_avis_google ? t("reviewCount", { n: r.nb_avis_google }) : null)} />
                  <Row label={t("labelCity")} values={residences.map((r) => r.ville)} />
                  <Row label={t("labelRegion")} values={residences.map((r) => r.region)} />
                  <Row label={t("labelCategory")} values={residences.map((r) => r.categorie)} />
                  <Row label={t("labelUnits")} values={residences.map((r) => r.nb_unites ? t("unitCount", { n: r.nb_unites }) : null)} />
                  <Row label={t("labelAddress")} values={residences.map((r) => r.adresse)} />
                  <Row label={t("labelPhone")} values={residences.map((r) =>
                    r.telephone ? (
                      <a key={r.id} href={`tel:${r.telephone}`} className="text-terracotta font-medium">
                        {r.telephone}
                      </a>
                    ) : null
                  )} />
                </tbody>
              </table>
            </div>

            {/* CTAs */}
            <div className="grid gap-4 mt-6"
              style={{ gridTemplateColumns: `8rem repeat(${residences.length}, 1fr)` }}
            >
              <div />
              {residences.map((r) => (
                <div key={r.id} className="flex flex-col gap-2">
                  {r.telephone && (
                    <a
                      href={`tel:${r.telephone}`}
                      className="block w-full bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-center py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {t("call")}
                    </a>
                  )}
                  <Link
                    href={`/residence/${r.id}`}
                    className="block w-full border border-gris hover:border-terracotta text-marine font-medium text-center py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {t("viewProfile")}
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/recherche" className="text-sm text-terracotta hover:underline">
                {t("backToSearch")}
              </Link>
            </div>
          </>
        )}
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-16">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
