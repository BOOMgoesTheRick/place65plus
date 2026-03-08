import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import ResidenceCard from "@/components/ResidenceCard";
import { getTranslations } from "next-intl/server";

async function getResidencesWithCoords(): Promise<Residence[]> {
  const { data } = await supabase
    .from("residences")
    .select("*")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(2000);
  return data ?? [];
}

export default async function CartePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "carte" });
  const tf = await getTranslations({ locale, namespace: "footer" });

  const residences = await getResidencesWithCoords();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 bg-white border-r border-gris overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gris sticky top-0 bg-white z-10">
            <h2 className="font-display font-bold text-marine">
              {t("residenceCount", { n: residences.length.toLocaleString(lcLocale) })}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("withGps")}
            </p>
          </div>
          <div className="p-3 space-y-3">
            {residences.slice(0, 50).map((r) => (
              <div key={r.id} className="scale-95 origin-top-left">
                <ResidenceCard residence={r} />
              </div>
            ))}
            {residences.length > 50 && (
              <p className="text-xs text-gray-400 text-center py-2">
                {t("clickMarker")}
              </p>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView residences={residences} apiKey={apiKey} />

          {/* Mobile bottom bar */}
          <div className="absolute bottom-4 left-4 right-4 md:hidden bg-white rounded-xl shadow-lg p-3 border border-gris">
            <p className="text-sm font-medium text-marine text-center">
              {t("mobileCount", { n: residences.length.toLocaleString(lcLocale) })}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
