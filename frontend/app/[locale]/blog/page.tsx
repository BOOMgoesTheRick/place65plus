import Header from "@/components/Header";
import { getArticlesForLocale } from "@/lib/blog";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: {
      canonical: `https://place65plus.quebec${locale === "en" ? "/en" : ""}/blog`,
      languages: {
        fr: "https://place65plus.quebec/blog",
        en: "https://place65plus.quebec/en/blog",
      },
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const tb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const articles = getArticlesForLocale(locale);
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">{tb("home")}</Link>
          <span>›</span>
          <span className="text-texte">{tb("guide")}</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-marine mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block bg-white rounded-2xl border border-gris p-6 hover:border-terracotta hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-terracotta/10 text-terracotta">
                  {article.categorie}
                </span>
                <span className="text-xs text-gray-400">{t("readTime", { time: article.tempsLecture })}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {new Date(article.date).toLocaleDateString(lcLocale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h2 className="font-display font-bold text-marine text-xl mb-2 group-hover:text-terracotta transition-colors">
                {article.titre}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">{article.description}</p>
              <p className="mt-4 text-terracotta text-sm font-medium">{t("readArticle")}</p>
            </Link>
          ))}
        </div>
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-12">
        <p>{tf("simple", { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
