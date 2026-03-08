import { supabase, Residence } from "@/lib/supabase";
import { getArticlesForLocale } from "@/lib/blog";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ResidenceCard from "@/components/ResidenceCard";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

async function getVedettes(): Promise<Residence[]> {
  const { data } = await supabase
    .from("residences").select("*")
    .not("photo_url", "is", null)
    .gte("nb_avis_google", 50)
    .gte("note_google", 4.0)
    .order("quality_score", { ascending: false, nullsFirst: false }).limit(90);
  const seen = new Set<string>();
  const results: Residence[] = [];
  for (const r of data ?? []) {
    const phoneKey = r.telephone ?? `__tel_${r.id}`;
    const domain = r.site_web ? (() => { try { return new URL(r.site_web).hostname.replace(/^www\./, ""); } catch { return null; } })() : null;
    const domainKey = domain ?? `__domain_${r.id}`;
    if (seen.has(phoneKey) || seen.has(domainKey)) continue;
    seen.add(phoneKey);
    seen.add(domainKey);
    results.push(r);
    if (results.length === 9) break;
  }
  return results;
}
async function getTotalCount(): Promise<number> {
  const { count } = await supabase
    .from("residences")
    .select("*", { count: "exact", head: true })
    .or("telephone.not.is.null,note_google.not.is.null");
  return count ?? 0;
}
async function getCitiesCount(): Promise<number> {
  const { data } = await supabase.from("residences").select("ville").not("ville", "is", null);
  return new Set((data ?? []).map((r) => r.ville)).size;
}
async function getTopRatedCount(): Promise<number> {
  const { count } = await supabase
    .from("residences")
    .select("*", { count: "exact", head: true })
    .gte("note_google", 4.0);
  return count ?? 0;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tf = await getTranslations({ locale, namespace: "footer" });
  const [vedettes, total, cities, topRated] = await Promise.all([getVedettes(), getTotalCount(), getCitiesCount(), getTopRatedCount()]);
  const articles = getArticlesForLocale(locale);
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-marine relative overflow-hidden">
        {/* Gradients d'ambiance */}
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 15% 60%, rgba(232,201,122,0.13) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(196,89,58,0.1) 0%, transparent 55%)" }} />
        {/* Grand "65" décoratif en filigrane */}
        <div className="hero-bg-num absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 select-none pointer-events-none" aria-hidden="true">
          <span className="font-display font-bold text-creme leading-none" style={{ fontSize: "clamp(160px, 22vw, 320px)", opacity: 0.035, letterSpacing: "-0.04em" }}>65</span>
        </div>
        {/* Ligne décorative gauche */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-or/30 to-transparent hidden lg:block" />

        <div className="max-w-4xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="text-center mb-12">
            <h1 className="hero-line-1 text-4xl md:text-6xl lg:text-7xl font-display font-bold text-creme mb-5 leading-[1.08] tracking-tight">
              {t("heroTitle")}<br />
              <span className="text-or">{t("heroTitleHighlight")}</span>
            </h1>
            <p className="hero-line-2 text-creme/60 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-light">
              {t("heroSubtitle")}
            </p>
          </div>
          <div className="hero-search">
            <SearchBar large placeholder={t("searchPlaceholder")} />
          </div>
        </div>
      </section>
      <section className="bg-gris border-b border-creme">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { value: total.toLocaleString(lcLocale), label: t("statsResidences") },
              { value: "18", label: t("statsRegions") },
              { value: cities.toLocaleString(lcLocale), label: t("statsCities") },
              { value: topRated.toLocaleString(lcLocale), label: t("statsTopRated") },
              { value: t("statsFree"), label: t("statsFreeLabel") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold text-terracotta">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {vedettes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-marine">{t("topRatedTitle")}</h2>
            <Link href="/recherche?note=4.5" className="text-terracotta hover:text-terracotta-dark font-medium text-sm hidden md:block">{t("seeAll")}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vedettes.map((r) => <ResidenceCard key={r.id} residence={r} />)}
          </div>
        </section>
      )}
      <section className="bg-marine text-creme py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">{t("howItWorksTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", titre: t("step1Title"), desc: t("step1Desc"), emoji: "🔍" },
              { step: "2", titre: t("step2Title"), desc: t("step2Desc"), emoji: "⚖️" },
              { step: "3", titre: t("step3Title"), desc: t("step3Desc"), emoji: "📞" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <div className="w-8 h-8 bg-or text-marine rounded-full flex items-center justify-center font-bold mx-auto mb-3 text-sm">{item.step}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.titre}</h3>
                <p className="text-creme/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-marine">{t("blogTitle")}</h2>
          <Link href="/blog" className="text-terracotta hover:text-terracotta-dark font-medium text-sm hidden md:block">{t("seeAllArticles")}</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="bg-white rounded-2xl border border-gris p-5 hover:border-terracotta hover:shadow-sm transition-all group">
              <h3 className="font-display font-semibold text-marine text-base mb-2 leading-snug group-hover:text-terracotta transition-colors">{a.titre}</h3>
              <p className="text-gray-400 text-xs">{t("readTime", { time: a.tempsLecture })}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="py-16 text-center px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-marine mb-4">{t("ctaTitle")}</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">{t("ctaSubtitle")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/recherche" className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors">{t("ctaSearch")}</Link>
          <Link href="/carte" className="bg-marine hover:bg-marine-light text-creme font-semibold px-8 py-3 rounded-xl transition-colors">{t("ctaMap")}</Link>
        </div>
      </section>
      <footer className="bg-marine text-creme/50 text-sm py-8 text-center px-4">
        <p>
          {tf("copyright", { year: new Date().getFullYear() })}{" "}
          <a href="https://www.msss.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="underline hover:text-creme">{tf("msssLabel")}</a>
        </p>
      </footer>
    </div>
  );
}
