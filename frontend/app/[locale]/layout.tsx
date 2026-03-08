import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "../globals.css";
import { CompareProvider } from "@/components/CompareContext";
import CompareBar from "@/components/CompareBar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = "https://place65plus.quebec";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(baseUrl),
    title: { default: t("siteTitle"), template: t("titleTemplate") },
    description: t("siteDesc"),
    keywords:
      locale === "fr"
        ? ["résidence pour aînés", "RPA", "Québec", "maison de retraite", "MSSS", "65+"]
        : ["senior residence", "retirement home", "Quebec", "RPA", "seniors", "65+"],
    authors: [{ name: "Place 65+" }],
    openGraph: {
      siteName: "Place 65+",
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      type: "website",
    },
    alternates: {
      canonical: locale === "fr" ? baseUrl : `${baseUrl}/en`,
      languages: { fr: baseUrl, en: `${baseUrl}/en` },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <CompareProvider>
            {children}
            <CompareBar />
          </CompareProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
