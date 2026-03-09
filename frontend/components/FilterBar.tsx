"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

const REGIONS = [
  "Bas-Saint-Laurent","Capitale-Nationale","Chaudière-Appalaches","Côte-Nord",
  "Estrie","Gaspésie–Îles-de-la-Madeleine","Lanaudière","Laurentides","Laval",
  "Mauricie","Montérégie","Montréal","Nord-du-Québec","Outaouais",
  "Saguenay–Lac-Saint-Jean","Abitibi-Témiscamingue","Centre-du-Québec",
];

const SERVICES = [
  { key: "service_repas",        icon: "🍽️" },
  { key: "service_soins",        icon: "🏥" },
  { key: "service_assistance",   icon: "🤝" },
  { key: "service_loisirs",      icon: "🎭" },
  { key: "service_securite",     icon: "🔒" },
] as const;

interface FilterBarProps {
  currentRegion?: string;
  currentCategorie?: string;
  currentRating?: string;
  currentServices?: string[];
}

export default function FilterBar({
  currentRegion = "",
  currentCategorie = "",
  currentRating = "",
  currentServices = [],
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("filters");
  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    startTransition(() => { router.push(`/recherche?${params.toString()}`); });
  };

  const toggleService = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("services");
    if (current.includes(key)) {
      params.delete("services");
      current.filter(s => s !== key).forEach(s => params.append("services", s));
    } else {
      params.append("services", key);
    }
    params.delete("page");
    startTransition(() => { router.push(`/recherche?${params.toString()}`); });
  };

  const hasFilters = currentRegion || currentCategorie || currentRating || currentServices.length > 0;

  return (
    <div className={`flex flex-wrap gap-3 items-center ${isPending ? "opacity-60" : ""}`}>
      <select value={currentRegion} onChange={(e) => updateFilter("region", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gris bg-white text-sm text-texte focus:border-terracotta focus:outline-none">
        <option value="">{t("allRegions")}</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <select value={currentRating} onChange={(e) => updateFilter("note", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gris bg-white text-sm text-texte focus:border-terracotta focus:outline-none">
        <option value="">{t("minRating")}</option>
        <option value="4.5">{t("r45")}</option>
        <option value="4">{t("r40")}</option>
        <option value="3.5">{t("r35")}</option>
        <option value="3">{t("r30")}</option>
      </select>

      {/* Service checkboxes */}
      <div className="flex flex-wrap gap-2">
        {SERVICES.map(({ key, icon }) => {
          const active = currentServices.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleService(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                active
                  ? "bg-terracotta text-white border-terracotta"
                  : "bg-white text-texte border-gris hover:border-terracotta"
              }`}
            >
              <span>{icon}</span>
              <span>{t(key as "service_repas")}</span>
            </button>
          );
        })}
      </div>

      {hasFilters && (
        <button onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          ["region","categorie","note","page","services"].forEach(k => params.delete(k));
          router.push(`/recherche?${params.toString()}`);
        }} className="text-sm text-terracotta hover:text-terracotta-dark font-medium underline">
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
