import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface FichePageProps {
  params: Promise<{ id: string }>;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-5 h-5 ${i <= Math.round(rating) ? "text-or" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-lg font-semibold text-texte ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default async function FichePage({ params }: FichePageProps) {
  const { id } = await params;
  const r = await getResidence(id);
  if (!r) notFound();

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    r.adresse ? `${r.nom}, ${r.adresse}, ${r.ville}, Quebec` : `${r.nom}, ${r.ville}, Quebec`
  )}`;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-terracotta">Accueil</Link>
          <span>›</span>
          <Link href="/recherche" className="hover:text-terracotta">Résidences</Link>
          <span>›</span>
          <span className="text-texte">{r.nom}</span>
        </nav>

        {/* Photo */}
        <div className="rounded-2xl overflow-hidden mb-8 bg-gris h-64 md:h-80 relative">
          {r.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.photo_url} alt={r.nom} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
          {r.categorie && (
            <span className="absolute top-4 left-4 bg-marine text-creme text-sm font-medium px-3 py-1 rounded-full">
              {r.categorie}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-marine mb-1">{r.nom}</h1>
              <p className="text-gray-500 text-lg">{r.ville}{r.region ? `, ${r.region}` : ""}</p>
              {r.note_google && (
                <div className="mt-3">
                  <StarRating rating={r.note_google} />
                  {r.nb_avis_google && (
                    <p className="text-sm text-gray-400 mt-0.5">{r.nb_avis_google} avis Google</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gris p-6 space-y-4">
              <h2 className="font-display font-semibold text-marine text-lg">Informations</h2>
              <dl className="space-y-3 text-sm">
                {r.adresse && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Adresse</dt>
                    <dd className="text-texte">{r.adresse}{r.code_postal ? `, ${r.code_postal}` : ""}</dd>
                  </div>
                )}
                {r.ville && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Ville</dt>
                    <dd className="text-texte">{r.ville}</dd>
                  </div>
                )}
                {r.region && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Région</dt>
                    <dd className="text-texte">{r.region}</dd>
                  </div>
                )}
                {r.categorie && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Catégorie</dt>
                    <dd className="text-texte">{r.categorie}</dd>
                  </div>
                )}
                {r.nb_unites && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Unités</dt>
                    <dd className="text-texte">{r.nb_unites} unités</dd>
                  </div>
                )}
                {r.site_web && (
                  <div className="flex gap-3">
                    <dt className="text-gray-400 w-28 shrink-0">Site web</dt>
                    <dd>
                      <a href={r.site_web} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline break-all">
                        {r.site_web.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-marine hover:text-terracotta font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Voir sur Google Maps
            </a>
          </div>

          {/* CTA sidebar */}
          <div className="space-y-4">
            {r.telephone ? (
              <a
                href={`tel:${r.telephone}`}
                className="block w-full bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-center py-4 px-6 rounded-2xl transition-colors text-lg"
              >
                📞 {r.telephone}
              </a>
            ) : (
              <div className="block w-full bg-gris text-gray-400 font-medium text-center py-4 px-6 rounded-2xl text-sm">
                Numéro non disponible
              </div>
            )}

            {/* Monetization placeholder */}
            <div className="bg-or/20 border border-or rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Résidence partenaire</p>
              <p className="text-sm text-marine font-medium mb-3">
                Visites guidées gratuites disponibles sur demande.
              </p>
              <a
                href={r.telephone ? `tel:${r.telephone}` : "#"}
                className="block w-full bg-marine hover:bg-marine-light text-creme font-semibold text-center py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Demander une visite
              </a>
              <p className="text-xs text-gray-400 mt-2">Annonce sponsorisée</p>
            </div>

            <Link
              href="/recherche"
              className="block w-full border border-gris hover:border-terracotta text-marine font-medium text-center py-3 px-6 rounded-2xl transition-colors text-sm"
            >
              ← Retour aux résultats
            </Link>

            <ContactForm residenceId={r.id} residenceNom={r.nom} />
          </div>
        </div>
      </div>

      <footer className="bg-marine text-creme/50 text-sm py-6 text-center px-4 mt-16">
        <p>© {new Date().getFullYear()} Place 65+</p>
      </footer>
    </div>
  );
}
