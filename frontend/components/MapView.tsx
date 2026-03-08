"use client";

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import { Residence } from "@/lib/supabase";

interface MapViewProps {
  residences: Residence[];
  apiKey: string;
}

function GeolocateController() {
  const map = useMap();

  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        map.setZoom(10);
      },
      () => { /* permission refusée — garder vue par défaut */ }
    );
  }, [map]);

  return null;
}

export default function MapView({ residences, apiKey }: MapViewProps) {
  const [selected, setSelected] = useState<Residence | null>(null);

  const withCoords = residences.filter((r) => r.latitude != null && r.longitude != null);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: 46.8, lng: -71.2 }}
        defaultZoom={7}
        mapId="momanetpopa-map"
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
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
  );
}
