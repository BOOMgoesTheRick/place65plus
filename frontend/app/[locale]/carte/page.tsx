import { supabase, Residence } from "@/lib/supabase";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapErrorBoundary from "@/components/MapErrorBoundary";

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
  const residences = await getResidencesWithCoords();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <MapErrorBoundary>
          <MapView residences={residences} apiKey={apiKey} locale={locale} />
        </MapErrorBoundary>
      </div>
    </div>
  );
}
