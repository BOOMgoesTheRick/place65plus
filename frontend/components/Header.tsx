"use client";

import { useState } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

function Logo() {
  return (
    <Link href="/" className="group leading-none select-none" aria-label="Place 65+">
      <div className="font-display font-bold text-creme group-hover:text-or/90 transition-colors duration-200" style={{ fontSize: "1.65rem" }}>
        Place <span className="text-or">65+</span>
      </div>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const alternateLocale = locale === "fr" ? "en" : "fr";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/recherche", label: t("findResidence") },
    { href: "/carte", label: t("interactiveMap") },
    { href: "/blog", label: t("guide") },
  ];

  return (
    <header className="bg-marine sticky top-0 z-50 shadow-lg border-b border-or/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Logo />

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? "text-or bg-or/10 nav-dot"
                    : "text-creme/70 hover:text-creme hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Droite */}
          <div className="flex items-center gap-3">
            <Link
              href={pathname}
              locale={alternateLocale}
              className="hidden md:flex items-center text-creme/50 hover:text-creme text-xs font-semibold border border-creme/20 hover:border-or/50 hover:text-or px-3 py-1.5 rounded-lg transition-all duration-200 tracking-widest"
            >
              {locale === "fr" ? "EN" : "FR"}
            </Link>

            {/* Hamburger mobile */}
            <button
              className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <span className={`block h-[2px] bg-creme rounded-full transition-all duration-250 origin-center ${mobileOpen ? "w-full rotate-45 translate-y-[7px]" : "w-full"}`} />
              <span className={`block h-[2px] bg-creme rounded-full transition-all duration-250 ${mobileOpen ? "w-0 opacity-0" : "w-4/5"}`} />
              <span className={`block h-[2px] bg-creme rounded-full transition-all duration-250 origin-center ${mobileOpen ? "w-full -rotate-45 -translate-y-[7px]" : "w-full"}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Menu mobile déroulant */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-72 border-t border-or/15" : "max-h-0"}`}>
        <div className="bg-marine-light px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                pathname === item.href
                  ? "text-or bg-or/10"
                  : "text-creme/75 hover:text-creme hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-creme/10 mt-2 pt-2">
            <Link
              href={pathname}
              locale={alternateLocale}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 text-sm text-creme/50 hover:text-or flex items-center gap-2 transition-colors"
            >
              <span className="text-xs border border-creme/20 px-2 py-0.5 rounded tracking-widest font-semibold">
                {locale === "fr" ? "EN" : "FR"}
              </span>
              <span>{locale === "fr" ? "English" : "Français"}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
