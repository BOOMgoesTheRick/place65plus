"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";

interface ContactFormProps {
  residenceId: number;
  residenceNom: string;
}

export default function ContactForm({ residenceId, residenceNom }: ContactFormProps) {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const t = useTranslations("contact");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("contacts").insert({
      residence_id: residenceId, nom: form.nom, email: form.email,
      telephone: form.telephone || null, message: form.message || null,
    });
    setStatus(error ? "error" : "sent");
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (status === "sent") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <h3 className="font-display font-semibold text-marine mb-1">{t("successTitle")}</h3>
        <p className="text-sm text-gray-500">{t("successDesc", { name: residenceNom })}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gris p-6">
      <h2 className="font-display font-semibold text-marine text-lg mb-1">{t("title")}</h2>
      <p className="text-sm text-gray-400 mb-5">{t("subtitle", { name: residenceNom })}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-texte mb-1">{t("labelName")}</label>
          <input type="text" required value={form.nom} onChange={set("nom")} placeholder={t("namePlaceholder")}
            className="w-full px-3 py-2.5 rounded-xl border border-gris focus:border-terracotta focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-texte mb-1">{t("labelEmail")}</label>
          <input type="email" required value={form.email} onChange={set("email")} placeholder={t("emailPlaceholder")}
            className="w-full px-3 py-2.5 rounded-xl border border-gris focus:border-terracotta focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-texte mb-1">{t("labelPhone")}</label>
          <input type="tel" value={form.telephone} onChange={set("telephone")} placeholder={t("phonePlaceholder")}
            className="w-full px-3 py-2.5 rounded-xl border border-gris focus:border-terracotta focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-texte mb-1">{t("labelMessage")}</label>
          <textarea value={form.message} onChange={set("message")} placeholder={t("messagePlaceholder")} rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gris focus:border-terracotta focus:outline-none text-sm resize-none" />
        </div>
        {status === "error" && <p className="text-sm text-red-500">{t("error")}</p>}
        <button type="submit" disabled={status === "sending"}
          className="w-full bg-marine hover:bg-marine-light text-creme font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-60">
          {status === "sending" ? t("sending") : t("submit")}
        </button>
        <p className="text-xs text-gray-400 text-center">{t("privacy")}</p>
      </form>
    </div>
  );
}
