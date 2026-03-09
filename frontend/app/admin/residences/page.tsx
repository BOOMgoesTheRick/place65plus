import { requireAuth } from "@/lib/admin-session";
import { deleteResidenceAction } from "@/app/admin/actions";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const REGIONS = [
  "Abitibi-Témiscamingue","Bas-Saint-Laurent","Capitale-Nationale",
  "Centre-du-Québec","Chaudière-Appalaches","Côte-Nord","Estrie",
  "Gaspésie–Îles-de-la-Madeleine","Lanaudière","Laurentides","Laval",
  "Mauricie","Montérégie","Montréal","Nord-du-Québec","Nunavik",
  "Outaouais","Saguenay–Lac-Saint-Jean","Terres-Cries-de-la-Baie-James",
];

const SUSPICIOUS_KEYWORDS = [
  "habitations","condo","condos","appartement","appartements","immobilier",
  "locatif","logement","logements","lofts","realty","investissement",
  "real-estate","realestate","rental","properties",
];

function isSuspicious(url: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SUSPICIOUS_KEYWORDS.some((k) => host.includes(k));
  } catch { return false; }
}

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{
    q?: string; region?: string; page?: string;
    no_phone?: string; no_website?: string; no_google?: string; suspicious?: string;
    deleted?: string; updated?: string;
  }>;
}

export default async function ResidencesPage({ searchParams }: Props) {
  await requireAuth();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const region = sp.region ?? "";
  const page = parseInt(sp.page ?? "1", 10);
  const noPhone = sp.no_phone === "1";
  const noWebsite = sp.no_website === "1";
  const noGoogle = sp.no_google === "1";
  const suspiciousOnly = sp.suspicious === "1";

  const sb = getSb();
  let query = sb.from("residences")
    .select("id, nom, ville, region, telephone, site_web, note_google, photo_url, quality_score", { count: "exact" });

  if (q) query = query.or(`nom.ilike.%${q}%,ville.ilike.%${q}%`);
  if (region) query = query.eq("region", region);
  if (noPhone) query = query.or("telephone.is.null,telephone.eq.");
  if (noWebsite) query = query.is("site_web", null);
  if (noGoogle) query = query.is("note_google", null);
  if (suspiciousOnly) {
    const clauses = SUSPICIOUS_KEYWORDS.map((k) => `site_web.ilike.%${k}%`).join(",");
    query = query.or(clauses);
  }

  query = query.order("id", { ascending: false });

  const fetchLimit = suspiciousOnly ? 2000 : PAGE_SIZE;
  const fetchOffset = suspiciousOnly ? 0 : (page - 1) * PAGE_SIZE;

  if (!suspiciousOnly) {
    query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);
  } else {
    query = query.limit(fetchLimit);
  }

  const { data: raw, count: dbCount } = await query;
  let rows = raw ?? [];
  let total = dbCount ?? 0;

  if (suspiciousOnly) {
    rows = rows.filter((r) => isSuspicious(r.site_web));
    total = rows.length;
    const start = (page - 1) * PAGE_SIZE;
    rows = rows.slice(start, start + PAGE_SIZE);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (region) params.set("region", region);
    if (noPhone) params.set("no_phone", "1");
    if (noWebsite) params.set("no_website", "1");
    if (noGoogle) params.set("no_google", "1");
    if (suspiciousOnly) params.set("suspicious", "1");
    if (p > 1) params.set("page", String(p));
    return `/admin/residences?${params.toString()}`;
  };

  const returnTo = buildUrl(page);
  const hasFilters = q || region || noPhone || noWebsite || noGoogle || suspiciousOnly;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "#1C2B4A", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Résidences
          </h1>
          <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "4px" }}>
            {total.toLocaleString("fr-CA")} résultat{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Toasts */}
      {sp.deleted && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: "0.8125rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          Résidence #{sp.deleted} supprimée.
        </div>
      )}
      {sp.updated && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "0.8125rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          Résidence #{sp.updated} mise à jour.
        </div>
      )}

      {/* Filters */}
      <form
        method="get"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#aaa", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
            Nom ou ville
          </label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher..."
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
            className="focus:border-marine/40"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#aaa", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
            Région
          </label>
          <select
            name="region"
            defaultValue={region}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", background: "#fff", outline: "none", cursor: "pointer" }}
          >
            <option value="">Toutes</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
          {[
            { name: "no_phone",  label: "Sans tél.",    checked: noPhone },
            { name: "no_website",label: "Sans site",    checked: noWebsite },
            { name: "no_google", label: "Sans Google",  checked: noGoogle },
            { name: "suspicious",label: "⚠ Suspects",   checked: suspiciousOnly },
          ].map(({ name, label, checked }) => (
            <label
              key={name}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#555", cursor: "pointer", userSelect: "none" }}
            >
              <input type="checkbox" name={name} value="1" defaultChecked={checked} style={{ accentColor: "#1C2B4A", cursor: "pointer" }} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            style={{ padding: "0.5rem 1rem", background: "#1C2B4A", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, borderRadius: "0.5rem", border: "none", cursor: "pointer", transition: "background 0.15s" }}
            className="hover:bg-marine-light"
          >
            Filtrer
          </button>
          {hasFilters && (
            <a
              href="/admin/residences"
              style={{ padding: "0.5rem 1rem", border: "1px solid rgba(0,0,0,0.12)", color: "#666", fontSize: "0.8125rem", borderRadius: "0.5rem", textDecoration: "none", transition: "border-color 0.15s" }}
              className="hover:border-gray-400"
            >
              Réinitialiser
            </a>
          )}
        </div>
      </form>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "#f8f7f4", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem", color: "#888", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", width: "3.5rem" }}>ID</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem", color: "#888", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Nom</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem", color: "#888", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", width: "8rem" }}>Ville</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem", color: "#888", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", width: "8.5rem" }}>Région</th>
              <th style={{ textAlign: "center", padding: "0.5rem 0.625rem", color: "#888", fontWeight: 600, fontSize: "0.75rem", width: "2.5rem" }} title="Téléphone">📞</th>
              <th style={{ textAlign: "center", padding: "0.5rem 0.625rem", color: "#888", fontWeight: 600, fontSize: "0.75rem", width: "2.5rem" }} title="Site web">🌐</th>
              <th style={{ textAlign: "center", padding: "0.5rem 0.625rem", color: "#888", fontWeight: 600, fontSize: "0.75rem", width: "2.5rem" }} title="Note Google">⭐</th>
              <th style={{ textAlign: "center", padding: "0.5rem 0.625rem", color: "#888", fontWeight: 600, fontSize: "0.75rem", width: "2.5rem" }} title="Photo">📷</th>
              <th style={{ padding: "0.75rem 1rem", width: "6rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const suspicious = isSuspicious(r.site_web);
              return (
                <tr
                  key={r.id}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.045)",
                    background: suspicious ? "#fff8f5" : "transparent",
                    transition: "background 0.12s",
                  }}
                  className="hover:bg-gray-50"
                >
                  <td style={{ padding: "0.625rem 1rem", color: "#bbb", fontSize: "0.7rem", fontFamily: "monospace" }}>
                    #{r.id}
                  </td>
                  <td style={{ padding: "0.625rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <a
                        href={`/admin/residence/${r.id}`}
                        style={{ fontWeight: 500, color: "#1a1a1a", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20rem", transition: "color 0.15s" }}
                        className="hover:text-marine"
                      >
                        {r.nom}
                      </a>
                      {suspicious && (
                        <span style={{ fontSize: "0.6rem", background: "#fff0eb", color: "#c4593a", fontWeight: 700, padding: "1px 6px", borderRadius: "100px", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>
                          Suspect
                        </span>
                      )}
                    </div>
                    {r.site_web && (
                      <a
                        href={r.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.7rem", color: suspicious ? "#c4593a" : "#aaa", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "20rem", transition: "color 0.15s" }}
                        className="hover:text-blue-500"
                      >
                        {r.site_web.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </td>
                  <td style={{ padding: "0.625rem 1rem", color: "#666", fontSize: "0.75rem" }}>{r.ville}</td>
                  <td style={{ padding: "0.625rem 1rem", color: "#888", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "8.5rem" }}>{r.region}</td>
                  <td style={{ padding: "0.625rem", textAlign: "center" }}>
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: r.telephone ? "#16a34a" : "#e5e7eb" }} />
                  </td>
                  <td style={{ padding: "0.625rem", textAlign: "center" }}>
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: r.site_web ? "#2563eb" : "#e5e7eb" }} />
                  </td>
                  <td style={{ padding: "0.625rem", textAlign: "center" }}>
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: r.note_google ? "#d97706" : "#e5e7eb" }} />
                  </td>
                  <td style={{ padding: "0.625rem", textAlign: "center" }}>
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: r.photo_url ? "#7c3aed" : "#e5e7eb" }} />
                  </td>
                  <td style={{ padding: "0.625rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <a
                        href={`/admin/residence/${r.id}`}
                        style={{ fontSize: "0.75rem", color: "#1C2B4A", fontWeight: 600, textDecoration: "none", transition: "color 0.15s" }}
                        className="hover:text-terracotta"
                      >
                        Éditer
                      </a>
                      <form action={deleteResidenceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 500, border: "1px solid #fee2e2", borderRadius: "0.375rem", padding: "2px 8px", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}
                          className="hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                        >
                          Suppr.
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "3rem 1rem", textAlign: "center", color: "#ccc", fontSize: "0.875rem" }}>
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          {page > 1 && (
            <a
              href={buildUrl(page - 1)}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "0.875rem", textDecoration: "none", color: "#444", transition: "border-color 0.15s" }}
              className="hover:border-gray-400"
            >
              ← Précédent
            </a>
          )}
          <span style={{ fontSize: "0.8125rem", color: "#999", padding: "0 0.5rem" }}>
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={buildUrl(page + 1)}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontSize: "0.875rem", textDecoration: "none", color: "#444", transition: "border-color 0.15s" }}
              className="hover:border-gray-400"
            >
              Suivant →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
