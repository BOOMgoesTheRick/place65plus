"use client";

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Residence } from "@/lib/supabase";
import ResidenceCard from "@/components/ResidenceCard";

interface MapViewProps {
  residences: Residence[];
  apiKey: string;
  locale: string;
}

interface Bounds {
  north: number; south: number; east: number; west: number;
}

function inBounds(r: Residence, b: Bounds): boolean {
  return (
    r.latitude! >= b.south && r.latitude! <= b.north &&
    r.longitude! >= b.west && r.longitude! <= b.east
  );
}

function GeolocateController() {
  const map = useMap();
  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map.setZoom(10); },
      () => {}
    );
  }, [map]);
  return null;
}

export default function MapView({ residences, apiKey, locale }: MapViewProps) {
  const t = useTranslations("carte");
  const lcLocale = locale === "fr" ? "fr-CA" : "en-CA";

  const [selected, setSelected] = useState<Residence | null>(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).gm_authFailure = () => setAuthFailed(true);
    return () => { delete (window as unknown as Record<string, unknown>).gm_authFailure; };
  }, []);

  const withCoords = residences.filter((r) => r.latitude != null && r.longitude != null);

  const visible = bounds
    ? withCoords.filter((r) => inBounds(r, bounds))
    : withCoords;

  if (authFailed) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 text-center p-8">
        <div>
          <p className="text-2xl mb-2">🗺️</p>
          <p className="font-semibold text-gray-700">Carte temporairement indisponible</p>
          <p className="text-sm text-gray-400 mt-1">Problème de clé Google Maps — réessayez dans quelques minutes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-80 shrink-0 bg-white border-r border-gris overflow-y-auto hidden md:flex md:flex-col">
        <div className="p-4 border-b border-gris sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-marine">
            {t("residenceCount", { n: visible.length.toLocaleString(lcLocale) })}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{t("withGps")}</p>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto">
          {visible.slice(0, 50).map((r) => (
            <div key={r.id} className="scale-95 origin-top-left">
              <ResidenceCard residence={r} />
            </div>
          ))}
          {visible.length > 50 && (
            <p className="text-xs text-gray-400 text-center py-2">{t("clickMarker")}</p>
          )}
          {visible.length === 0 && bounds && (
            <p className="text-sm text-gray-400 text-center py-8">Aucune résidence dans cette zone</p>
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 46.8, lng: -71.2 }}
            defaultZoom={7}
            mapId="momanetpopa-map"
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            onBoundsChanged={(e) => setBounds(e.detail.bounds)}
          >
            <GeolocateController />
            {withCoords.map((r) => (
              <AdvancedMarker
                key={r.id}
                position={{ lat: r.latitude!, lng: r.longitude! }}
                onClick={() => setSelected(r)}
              >
                <Pin background="#C4593A" borderColor="#A84830" glyphColor="#FAF7F2" />
              </AdvancedMarker>
            ))}

            {selected && selected.latitude && selected.longitude && (
              <InfoWindow
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="p-1 max-w-[220px]">
                  <h3 className="font-semibold text-marine text-sm leading-tight mb-1">{selected.nom}</h3>
                  <p className="text-gray-500 text-xs mb-1">{selected.ville}</p>
                  {selected.note_google && (
                    <p className="text-xs text-or font-medium mb-1">
                      ⭐ {selected.note_google.toFixed(1)}
                      {selected.nb_avis_google ? ` (${selected.nb_avis_google} avis)` : ""}
                    </p>
                  )}
                  {selected.telephone && (
                    <a href={`tel:${selected.telephone}`} className="text-xs text-terracotta font-medium">
                      {selected.telephone}
                    </a>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Mobile bottom bar */}
        <div className="absolute bottom-4 left-4 right-4 md:hidden bg-white rounded-xl shadow-lg p-3 border border-gris">
          <p className="text-sm font-medium text-marine text-center">
            {t("mobileCount", { n: visible.length.toLocaleString(lcLocale) })}
          </p>
        </div>
      </div>
    </>
  );
}
