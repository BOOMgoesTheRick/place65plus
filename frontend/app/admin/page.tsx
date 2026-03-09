import { requireAuth } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const REGIONS = [
  "Montérégie","Montréal","Chaudière-Appalaches","Capitale-Nationale",
  "Laurentides","Lanaudière","Mauricie","Estrie","Outaouais",
  "Laval","Saguenay–Lac-Saint-Jean","Bas-Saint-Laurent",
  "Abitibi-Témiscamingue","Gaspésie–Îles-de-la-Madeleine",
  "Côte-Nord","Centre-du-Québec","Nord-du-Québec","Terres-Cries-de-la-Baie-James","Nunavik",
];

const statCards = [
  { key: "total",    label: "Total résidences", icon: "🏠", accent: "#1C2B4A" },
  { key: "phone",    label: "Avec téléphone",   icon: "📞", accent: "#16a34a" },
  { key: "website",  label: "Avec site web",    icon: "🌐", accent: "#2563eb" },
  { key: "google",   label: "Données Google",   icon: "⭐", accent: "#d97706" },
  { key: "photo",    label: "Avec photo",       icon: "📷", accent: "#7c3aed" },
  { key: "incomplete",label: "Incomplètes",     icon: "⚠️", accent: "#dc2626" },
];

export default async function AdminDashboard() {
  await requireAuth();
  const sb = getSb();

  const [
    { count: total },
    { count: withPhone },
    { count: withWebsite },
    { count: withGoogle },
    { count: withPhoto },
    { count: incomplete },
    { data: regionRows },
  ] = await Promise.all([
    sb.from("residences").select("*", { count: "exact", head: true }),
    sb.from("residences").select("*", { count: "exact", head: true }).not("telephone", "is", null).neq("telephone", ""),
    sb.from("residences").select("*", { count: "exact", head: true }).not("site_web", "is", null),
    sb.from("residences").select("*", { count: "exact", head: true }).not("note_google", "is", null),
    sb.from("residences").select("*", { count: "exact", head: true }).not("photo_url", "is", null),
    sb.from("residences").select("*", { count: "exact", head: true })
      .or("telephone.is.null,telephone.eq.").is("site_web", null).is("note_google", null),
    sb.from("residences").select("region"),
  ]);

  const regionCounts: Record<string, number> = {};
  for (const r of regionRows ?? []) {
    const reg = r.region ?? "Inconnue";
    regionCounts[reg] = (regionCounts[reg] ?? 0) + 1;
  }

  const pct = (n: number | null) =>
    total ? `${Math.round(((n ?? 0) / total) * 100)}%` : "—";

  const values: Record<string, string> = {
    total:      total?.toLocaleString("fr-CA") ?? "—",
    phone:      withPhone?.toLocaleString("fr-CA") ?? "—",
    website:    withWebsite?.toLocaleString("fr-CA") ?? "—",
    google:     withGoogle?.toLocaleString("fr-CA") ?? "—",
    photo:      withPhoto?.toLocaleString("fr-CA") ?? "—",
    incomplete: incomplete?.toLocaleString("fr-CA") ?? "—",
  };

  const subs: Record<string, string> = {
    phone:      pct(withPhone),
    website:    pct(withWebsite),
    google:     pct(withGoogle),
    photo:      pct(withPhoto),
    incomplete: pct(incomplete),
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "#1C2B4A", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            Dashboard
          </h1>
          <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "4px" }}>Vue d'ensemble de la base de données</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/residences"
            style={{ background: "#1C2B4A", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.625rem", textDecoration: "none", transition: "background 0.15s" }}
            className="hover:bg-marine-light"
          >
            Gérer les résidences →
          </a>
          <a
            href="/admin/cleanup"
            style={{ background: "#C4593A", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "0.625rem", textDecoration: "none", transition: "background 0.15s" }}
            className="hover:bg-terracotta-dark"
          >
            Nettoyage →
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map(({ key, label, icon, accent }) => (
          <div
            key={key}
            style={{
              background: "#fff",
              borderRadius: "0.875rem",
              padding: "1.125rem 1rem",
              borderLeft: `3px solid ${accent}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "1.25rem", marginBottom: "8px", lineHeight: 1 }}>{icon}</div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {values[key]}
            </p>
            {subs[key] && (
              <p style={{ fontSize: "0.7rem", color: accent, fontWeight: 600, marginTop: "2px", opacity: 0.8 }}>
                {subs[key]}
              </p>
            )}
            <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "6px", fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Region breakdown */}
      <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.9375rem" }}>Résidences par région</h2>
        </div>
        <div>
          {REGIONS.filter((r) => regionCounts[r]).map((region, i) => {
            const count = regionCounts[region] ?? 0;
            const pctRegion = total ? (count / total) * 100 : 0;
            return (
              <div
                key={region}
                style={{
                  padding: "0.625rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.04)",
                  transition: "background 0.15s",
                }}
                className="hover:bg-gray-50"
              >
                <span style={{ fontSize: "0.8125rem", color: "#444", minWidth: "16rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {region}
                </span>
                <div style={{ flex: 1, background: "#f0ede8", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
                  <div
                    style={{ background: "#1C2B4A", height: "6px", borderRadius: "100px", width: `${pctRegion}%`, transition: "width 0.5s ease" }}
                  />
                </div>
                <a
                  href={`/admin/residences?region=${encodeURIComponent(region)}`}
                  style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1C2B4A", textDecoration: "none", minWidth: "3rem", textAlign: "right", transition: "color 0.15s" }}
                  className="hover:text-terracotta"
                >
                  {count}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
