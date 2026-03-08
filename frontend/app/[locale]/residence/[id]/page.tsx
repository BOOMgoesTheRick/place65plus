import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface FichePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: FichePageProps): Promise<Metadata> {
  const { id } = await params;
  const r = await getResidence(id);
  if (!r) return { title: "Résidence introuvable" };

  const title = `${r.nom} — Résidence pour aînés à ${r.ville ?? "Québec"}`;
  const description = `Fiche complète de ${r.nom}${r.ville ? ` à ${r.ville}` : ""}${r.region ? `, ${r.region}` : ""}. ${r.note_google ? `Note Google : ${r.note_google}/5.` : ""} Téléphone, adresse, catégorie MSSS et plus.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: r.photo_url ? [{ url: r.photo_url }] : [],
      type: "website",
    },
    alternates: {
      canonical: `https://place65plus.quebec/residence/${id}`,
    },
  };
}

async function getResidence(id: string): Promise<Residence | null> {
  const { data } = await supabase
    .from("residences")
    .select("*")
    .eq("id", parseInt(id, 10))
    .single();
  return data ?? null;
}

async function getNearby(r: Residence): Promise<Residence[]> {
  if (!r.latitude || !r.longitude) {
    // fallback: same city
    const { data } = await supabase
      .from("residences")
      .select("*")
      .eq("ville", r.ville ?? "")
      .neq("id", r.id)
      .order("quality_score", { ascending: false })
      .limit(4);
    return data ?? [];
  }

  const { data: ids } = await supabase.rpc("residences_near_point", {
    lat: r.latitude,
    lng: r.longitude,
    radius_km: 20,
  });

  if (!ids || ids.length === 0) return [];

  const nearbyIds = (ids as { id: number }[])
    .map((row) => row.id)
    .filter((id) => id !== r.id)
    .slice(0, 4);

  if (nearbyIds.length === 0) return [];

  const { data } = await supabase
    .from("residences")
    .select("*")
    .in("id", nearbyIds)
    .order("quality_score", { ascending: false });

  return data ?? [];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i <= Math.round(rating) ? "text-or" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-lg font-semibold text-texte ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-gris last:border-0">
      <dt className="text-gray-400 text-sm w-36 shrink-0">{label}</dt>
      <dd className="text-texte text-sm flex-1">{value}</dd>
    </div>
  );
}

const LANGUE_LABEL: Record<string, string> = {
  francais: "Français",
  anglais: "Anglais",
  bilingue: "Bilingue",
};

export default async function FichePage({ params }: FichePageProps) {
  const { id } = await params;
  const r = await getResidence(id);
  if (!r) notFound();

  const nearby = await getNearby(r);

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    r.adresse ? `${r.nom}, ${r.adresse}, ${r.ville}, Quebec` : `${r.nom}, ${r.ville}, Quebec`
  )}`;

  const gmapsReviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${r.nom} ${r.ville ?? ""} Quebec`
  )}`;

  const mapEmbedUrl =
    r.latitude && r.longitude
      ? `https://maps.google.com/maps?q=${r.latitude},${r.longitude}&z=15&t=m&output=embed`
      : null;

  const jsonLdBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: r.nom,
    url: r.site_web ?? `https://place65plus.quebec/residence/${r.id}`,
    ...(r.telephone && { telephone: r.telephone }),
    ...(r.photo_url && { image: r.photo_url }),
    address: {
      "@type": "PostalAddress",
      ...(r.adresse && { streetAddress: r.adresse }),
      ...(r.ville && { addressLocality: r.ville }),
      ...(r.region && { addressRegion: r.region }),
      ...(r.code_postal && { postalCode: r.code_postal }),
      addressCountry: "CA",
    },
    ...(r.latitude && r.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: r.latitude,
        longitude: r.longitude,
      },
    }),
    ...(r.note_google && r.nb_avis_google && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: r.note_google.toFixed(1),
        reviewCount: r.nb_avis_google,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://place65plus.quebec" },
      ...(r.region
        ? [{ "@type": "ListItem", position: 2, name: r.region, item: `https://place65plus.quebec/residences/region/${encodeURIComponent(r.region.toLowerCase().replace(/ /g, "-"))}` }]
        : []),
      ...(r.ville
        ? [{ "@type": "ListItem", position: r.region ? 3 : 2, name: r.ville, item: `https://place65plus.quebec/residences/${encodeURIComponent(r.ville.toLowerCase().replace(/ /g, "-"))}` }]
        : []),
      { "@type": "ListItem", position: (r.region ? 1 : 0) + (r.ville ? 1 : 0) + 2, name: r.nom, item: `https://place65plus.quebec/residence/${r.id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      {/* Hero photo */}
      <div className="w-full h-72 md:h-96 bg-gris relative overflow-hidden">
        {r.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.photo_url} alt={r.nom} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {r.statut && (
          <span className="absolute bottom-4 left-4 bg-white/90 text-marine text-xs font-semibold px-3 py-1.5 rounded-full">
            ✓ {r.statut}
          </span>
        )}
        {r.categorie && (
          <span className="absolute bottom-4 left-4 ml-[calc(theme(spacing.4)+80px)] bg-marine text-creme text-xs font-medium px-3 py-1.5 rounded-full hidden sm:inline-block">
            {r.categorie}
          </span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-terracotta">Accueil</Link>
          <span>›</span>
          {r.region && (
            <>
              <Link href={`/residences/region/${encodeURIComponent(r.region)}`} className="hover:text-terracotta">
                {r.region}
              </Link>
              <span>›</span>
            </>
          )}
          {r.ville && (
            <>
              <Link href={`/residences/${encodeURIComponent(r.ville)}`} className="hover:text-terracotta">
                {r.ville}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-texte truncate max-w-[200px]">{r.nom}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="md:col-span-2 space-y-6">
            {/* Title + rating */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {r.categorie && (
                  <span className="bg-marine/10 text-marine text-xs font-medium px-2.5 py-1 rounded-full">
                    {r.categorie}
                  </span>
                )}
                {r.statut && (
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✓ {r.statut}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-display font-bold text-marine mb-1">{r.nom}</h1>
              <p className="text-gray-500 text-lg">
                {r.ville}{r.region ? `, ${r.region}` : ""}
              </p>
              {r.note_google && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <StarRating rating={r.note_google} />
                  {r.nb_avis_google && (
                    <a
                      href={gmapsReviewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-terracotta hover:underline"
                    >
                      {r.nb_avis_google} avis Google →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gris p-6">
              <h2 className="font-display font-semibold text-marine text-lg mb-4">Informations</h2>
              <dl>
                <InfoRow
                  label="Adresse"
                  value={
                    r.adresse
                      ? `${r.adresse}${r.code_postal ? `, ${r.code_postal}` : ""}`
                      : r.code_postal
                  }
                />
                <InfoRow label="Ville" value={r.ville} />
                <InfoRow label="Région" value={r.region} />
                <InfoRow label="MRC" value={r.mrc} />
                <InfoRow label="Catégorie MSSS" value={r.categorie} />
                <InfoRow label="Statut" value={r.statut} />
                <InfoRow
                  label="Unités"
                  value={r.nb_unites ? `${r.nb_unites} unités` : null}
                />
                <InfoRow
                  label="Langue de service"
                  value={r.langue_service ? (LANGUE_LABEL[r.langue_service] ?? r.langue_service) : null}
                />
                <InfoRow
                  label="Prix"
                  value={
                    r.prix_min || r.prix_max
                      ? `${r.prix_min ? `À partir de ${r.prix_min.toLocaleString("fr-CA")} $/mois` : ""}${r.prix_max ? ` — jusqu'à ${r.prix_max.toLocaleString("fr-CA")} $/mois` : ""}`
                      : null
                  }
                />
                <InfoRow
                  label="Site web"
                  value={
                    r.site_web ? (
                      <a
                        href={r.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terracotta hover:underline break-all"
                      >
                        {r.site_web.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    ) : null
                  }
                />
              </dl>
            </div>

            {/* Map */}
            {mapEmbedUrl && (
              <div className="bg-white rounded-2xl border border-gris overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                  <h2 className="font-display font-semibold text-marine text-lg">Localisation</h2>
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-terracotta hover:underline font-medium"
                  >
                    Ouvrir dans Google Maps →
                  </a>
                </div>
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Carte — ${r.nom}`}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Phone */}
            {r.telephone ? (
              <a
                href={`tel:${r.telephone}`}
                className="flex items-center justify-center gap-2 w-full bg-terracotta hover:bg-terracotta-dark text-white font-semibold py-4 px-6 rounded-2xl transition-colors text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {r.telephone}
              </a>
            ) : (
              <div className="w-full bg-gris text-gray-400 font-medium text-center py-4 px-6 rounded-2xl text-sm">
                Numéro non disponible
              </div>
            )}

            {/* Website */}
            {r.site_web && (
              <a
                href={r.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border-2 border-marine hover:bg-marine hover:text-creme text-marine font-semibold py-3 px-6 rounded-2xl transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visiter le site web
              </a>
            )}

            {/* Google Maps */}
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gris hover:border-terracotta text-texte hover:text-terracotta font-medium py-3 px-6 rounded-2xl transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Itinéraire Google Maps
            </a>

            {/* Google Reviews */}
            {r.note_google && r.nb_avis_google && (
              <a
                href={gmapsReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-gris hover:border-or text-texte hover:text-or font-medium py-3 px-6 rounded-2xl transition-colors text-sm"
              >
                <svg className="w-4 h-4 text-or" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {r.note_google.toFixed(1)} · {r.nb_avis_google} avis Google
              </a>
            )}

            {/* Divider */}
            <div className="border-t border-gris pt-4">
              <Link
                href="/recherche"
                className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-marine font-medium py-2 text-sm transition-colors"
              >
                ← Retour aux résultats
              </Link>
            </div>

            {/* Claim CTA — monetization */}
            {!r.fiche_reclamee && (
              <div className="bg-or/15 border border-or/40 rounded-2xl p-5">
                <p className="text-xs font-semibold text-marine uppercase tracking-wide mb-1">
                  Vous gérez cette résidence?
                </p>
                <p className="text-sm text-texte mb-3">
                  Réclamez cette fiche pour ajouter vos photos, description, tarifs et être mis en avant.
                </p>
                <a
                  href="mailto:info@place65plus.quebec?subject=Réclamation de fiche"
                  className="block w-full bg-marine hover:bg-marine-light text-creme font-semibold text-center py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  Réclamer cette fiche
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Nearby residences */}
        {nearby.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display font-bold text-marine text-2xl mb-6">
              Résidences à proximité
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearby.map((n) => (
                <Link
                  key={n.id}
                  href={`/residence/${n.id}`}
                  className="bg-white rounded-2xl border border-gris overflow-hidden hover:shadow-md hover:border-terracotta/40 transition-all group"
                >
                  <div className="h-36 bg-gris relative overflow-hidden">
                    {n.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.photo_url}
                        alt={n.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-marine text-sm leading-snug line-clamp-2 mb-1">
                      {n.nom}
                    </p>
                    <p className="text-xs text-gray-400">{n.ville}</p>
                    {n.note_google && (
                      <p className="text-xs text-or font-semibold mt-1">★ {n.note_google.toFixed(1)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-16">
        <p>© {new Date().getFullYear()} Place 65+</p>
      </footer>
    </div>
    </>
  );
}
