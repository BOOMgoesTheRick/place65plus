"use client";

import { useCompare } from "./CompareContext";
import { useTranslations } from "next-intl";

export default function CompareButton({ id }: { id: number }) {
  const { toggle, isSelected, ids } = useCompare();
  const t = useTranslations("compare");
  const selected = isSelected(id);
  const full = ids.length >= 3 && !selected;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      disabled={full}
      title={full ? t("maxThree") : selected ? t("removeFromCompare") : t("addToCompare")}
      className={`absolute bottom-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
        selected ? "bg-marine text-creme border-marine"
        : full ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
        : "bg-white text-marine border-gris hover:border-marine"
      }`}
    >
      {selected ? t("removeFromCompare") : t("addToCompare")}
    </button>
  );
}
