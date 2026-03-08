"use client";

import { useCompare } from "./CompareContext";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const t = useTranslations("compareBar");

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-marine text-creme shadow-2xl border-t-2 border-or">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-or font-semibold text-sm">
            {ids.length === 1 ? t("selected", { count: ids.length }) : t("selectedPlural", { count: ids.length })}
          </span>
          <span className="text-creme/40 text-xs hidden sm:block">{t("max")}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clear} className="text-creme/60 hover:text-creme text-sm underline">{t("clear")}</button>
          <Link href={`/comparer?ids=${ids.join(",")}`}
            className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {t("compare")}
          </Link>
        </div>
      </div>
    </div>
  );
}
