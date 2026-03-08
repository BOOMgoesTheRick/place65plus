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
interface FilterBarProps {
  currentRegion?: string;
  currentCategorie?: string;
  currentRating?: string;
}

export default function FilterBar({ currentRegion = "", currentCategorie = "", currentRating = "" }: FilterBarProps) {
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

      {(currentRegion || currentCategorie || currentRating) && (
        <button onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          ["region","categorie","note","page"].forEach(k => params.delete(k));
          router.push(`/recherche?${params.toString()}`);
        }} className="text-sm text-terracotta hover:text-terracotta-dark font-medium underline">
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
