import { Link } from "@/i18n/navigation";
import { Residence } from "@/lib/supabase";
import CompareButton from "./CompareButton";

interface ResidenceCardProps {
  residence: Residence;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "text-or" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function fixPhotoUrl(url: string | null): string | null {
  if (!url || !url.includes("place/photo")) return url;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return url;
  return url.replace(/key=[^&]+/, `key=${key}`);
}

export default function ResidenceCard({ residence }: ResidenceCardProps) {
  const photoUrl = fixPhotoUrl(residence.photo_url);
  return (
    <div className="relative">
    <Link href={`/residence/${residence.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gris group">
      {/* Photo */}
      <div className="relative h-44 bg-gris overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={residence.nom}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-marine text-base leading-tight mb-1 line-clamp-2">
          {residence.nom}
        </h3>
        <p className="text-gray-500 text-sm mb-2">
          {residence.ville}{residence.region ? ` · ${residence.region}` : ""}
        </p>

        {residence.note_google && (
          <div className="mb-2">
            <StarRating rating={residence.note_google} />
            {residence.nb_avis_google && (
              <span className="text-xs text-gray-400">({residence.nb_avis_google} avis)</span>
            )}
          </div>
        )}

        {residence.telephone && (
          <a href={`tel:${residence.telephone}`} className="text-sm text-terracotta hover:text-terracotta-dark font-medium">
            {residence.telephone}
          </a>
        )}
      </div>
    </Link>
    <CompareButton id={residence.id} />
    </div>
  );
}
