import Header from "@/components/Header";
import { articleData, getArticle, getArticlesForLocale } from "@/lib/blog";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return articleData.flatMap((a) => [
    { locale: "fr", slug: a.fr.slug },
    { locale: "en", slug: a.en.slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(slug, locale);
  if (!article) return { title: locale === "fr" ? "Article introuvable" : "Article not found" };
  return {
    title: article.titre,
    description: article.description,
    alternates: {
      canonical: `https://place65plus.quebec${locale === "en" ? "/en" : ""}/blog/${slug}`,
    },
    openGraph: { title: article.titre, description: article.description, type: "article" },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const article = getArticle(slug, locale);
  if (!article) notFound();

  const otherArticles = getArticlesForLocale(locale).filter((a) => a.slug !== slug);
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">{tb("home")}</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-terracotta">{tb("guide")}</Link>
          <span>›</span>
          <span className="text-texte line-clamp-1">{article.titre}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-terracotta/10 text-terracotta">
              {article.categorie}
            </span>
            <span className="text-xs text-gray-400">{t("readTime", { time: article.tempsLecture })}</span>
            <span className="text-xs text-gray-400">
              {new Date(article.date).toLocaleDateString(lcLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-marine leading-tight mb-4">
            {article.titre}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">{article.description}</p>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-display prose-headings:text-marine
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-li:text-gray-600
            prose-strong:text-texte
            prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline
            prose-table:text-sm prose-th:bg-gris prose-th:text-marine prose-th:font-semibold
            prose-td:border prose-td:border-gris prose-td:px-3 prose-td:py-2"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        {/* CTA */}
        <div className="mt-12 bg-marine rounded-2xl p-8 text-center">
          <h2 className="font-display font-bold text-creme text-2xl mb-3">
            {t("ctaTitle")}
          </h2>
          <p className="text-creme/70 mb-6 text-sm">
            {t("ctaDesc")}
          </p>
          <Link
            href="/recherche"
            className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            {t("ctaButton")}
          </Link>
        </div>

        {/* Other articles */}
        <div className="mt-12">
          <h3 className="font-display font-semibold text-marine text-lg mb-4">
            {t("otherArticles")}
          </h3>
          <div className="space-y-3">
            {otherArticles.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="block bg-white border border-gris rounded-xl p-4 hover:border-terracotta transition-colors group"
              >
                <span className="text-xs text-terracotta font-medium">{a.categorie} · {a.tempsLecture}</span>
                <p className="font-display font-semibold text-marine text-sm mt-1 group-hover:text-terracotta transition-colors">
                  {a.titre}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-12">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
