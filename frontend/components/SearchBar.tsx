"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  large?: boolean;
}

export default function SearchBar({ defaultValue = "", placeholder, large = false }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const t = useTranslations("nav");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? ""}
          className={`flex-1 rounded-xl border-2 border-gris bg-white px-4 focus:border-terracotta focus:outline-none transition-colors text-texte placeholder:text-gray-400 ${
            large ? "py-4 text-lg" : "py-2.5 text-base"
          }`}
        />
        <button
          type="submit"
          className={`bg-terracotta hover:bg-terracotta-dark text-white font-semibold rounded-xl transition-colors whitespace-nowrap ${
            large ? "px-8 py-4 text-lg" : "px-6 py-2.5 text-base"
          }`}
        >
          {t("search")}
        </button>
      </div>
    </form>
  );
}
