import { requireAuth } from "@/lib/admin-session";
import { deleteResidenceAction, bulkDeleteAction } from "@/app/admin/actions";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

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

const tableStyle = { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.875rem" };
const thStyle = {
  textAlign: "left" as const,
  padding: "0.75rem 1rem",
  color: "#aaa",
  fontWeight: 600,
  fontSize: "0.65rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  background: "#f8f7f4",
  borderBottom: "1px solid rgba(0,0,0,0.07)",
};

export default async function CleanupPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const sb = getSb();

  const [{ data: incompleteRows }, { data: allWithWebsite }] = await Promise.all([
    sb.from("residences")
      .select("id, nom, ville, region")
      .or("telephone.is.null,telephone.eq.")
      .is("site_web", null)
      .is("note_google", null)
      .order("id", { ascending: false }),
    sb.from("residences")
      .select("id, nom, ville, region, site_web")
      .not("site_web", "is", null)
      .order("id", { ascending: false }),
  ]);

  const incomplete = incompleteRows ?? [];
  const suspicious = (allWithWebsite ?? []).filter((r) => isSuspicious(r.site_web));
  const incompleteIds = incomplete.map((r) => r.id).join(",");
  const deletedCount = sp.deleted ? parseInt(sp.deleted) : 0;

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "#1C2B4A", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Nettoyage
        </h1>
        <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "4px" }}>Fiches incomplètes et domaines suspects</p>
      </div>

      {sp.deleted && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: "0.8125rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
          ✓ {deletedCount} fiche{deletedCount > 1 ? "s" : ""} supprimée{deletedCount > 1 ? "s" : ""}.
        </div>
      )}

      {/* ── Incomplete ── */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "4px" }}>
              <h2 style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "1rem" }}>Fiches incomplètes</h2>
              <span style={{ fontSize: "0.65rem", background: incomplete.length > 0 ? "#fef2f2" : "#f0fdf4", color: incomplete.length > 0 ? "#b91c1c" : "#15803d", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", letterSpacing: "0.05em" }}>
                {incomplete.length}
              </span>
            </div>
            <p style={{ color: "#aaa", fontSize: "0.8125rem" }}>Sans téléphone · sans site web · sans données Google</p>
          </div>
          {incomplete.length > 0 && (
            <form action={bulkDeleteAction}>
              <input type="hidden" name="ids" value={incompleteIds} />
              <button
                type="submit"
                style={{ padding: "0.5rem 1rem", background: "#dc2626", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, borderRadius: "0.5rem", border: "none", cursor: "pointer", transition: "background 0.15s", flexShrink: 0 }}
                className="hover:bg-red-700"
              >
                Tout supprimer ({incomplete.length})
              </button>
            </form>
          )}
        </div>

        {incomplete.length === 0 ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "0.875rem", padding: "2.5rem", textAlign: "center", color: "#15803d", fontSize: "0.875rem" }}>
            ✓ Aucune fiche incomplète.
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "3.5rem" }}>ID</th>
                  <th style={thStyle}>Nom</th>
                  <th style={{ ...thStyle, width: "8rem" }}>Ville</th>
                  <th style={{ ...thStyle, width: "10rem" }}>Région</th>
                  <th style={{ ...thStyle, width: "5rem", textAlign: "right" as const }}></th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.045)", transition: "background 0.12s" }}
                    className="hover:bg-gray-50"
                  >
                    <td style={{ padding: "0.625rem 1rem", color: "#ccc", fontSize: "0.7rem", fontFamily: "monospace" }}>#{r.id}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <a href={`/admin/residence/${r.id}`} style={{ fontWeight: 500, color: "#1a1a1a", textDecoration: "none", transition: "color 0.15s" }} className="hover:text-marine">
                        {r.nom}
                      </a>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "#888", fontSize: "0.8125rem" }}>{r.ville}</td>
                    <td style={{ padding: "0.625rem 1rem", color: "#aaa", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.region}</td>
                    <td style={{ padding: "0.625rem 1rem", textAlign: "right" }}>
                      <form action={deleteResidenceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="returnTo" value="/admin/cleanup" />
                        <button
                          type="submit"
                          style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 500, border: "1px solid #fee2e2", borderRadius: "0.375rem", padding: "2px 8px", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}
                          className="hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                        >
                          Suppr.
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Suspicious ── */}
      <section>
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "4px" }}>
            <h2 style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "1rem" }}>Domaines suspects</h2>
            <span style={{ fontSize: "0.65rem", background: suspicious.length > 0 ? "#fff7ed" : "#f0fdf4", color: suspicious.length > 0 ? "#c2410c" : "#15803d", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", letterSpacing: "0.05em" }}>
              {suspicious.length}
            </span>
          </div>
          <p style={{ color: "#aaa", fontSize: "0.8125rem" }}>Sites web avec mots-clés immobiliers dans le domaine</p>
        </div>

        {suspicious.length === 0 ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "0.875rem", padding: "2.5rem", textAlign: "center", color: "#15803d", fontSize: "0.875rem" }}>
            ✓ Aucun domaine suspect.
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "3.5rem" }}>ID</th>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Site web</th>
                  <th style={{ ...thStyle, width: "8rem" }}>Ville</th>
                  <th style={{ ...thStyle, width: "6.5rem", textAlign: "right" as const }}></th>
                </tr>
              </thead>
              <tbody>
                {suspicious.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.045)", background: "#fff9f7", transition: "background 0.12s" }}
                    className="hover:bg-orange-50"
                  >
                    <td style={{ padding: "0.625rem 1rem", color: "#ccc", fontSize: "0.7rem", fontFamily: "monospace" }}>#{r.id}</td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <a href={`/admin/residence/${r.id}`} style={{ fontWeight: 500, color: "#1a1a1a", textDecoration: "none", transition: "color 0.15s" }} className="hover:text-marine">
                        {r.nom}
                      </a>
                    </td>
                    <td style={{ padding: "0.625rem 1rem" }}>
                      <a
                        href={r.site_web!}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.75rem", color: "#c4593a", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "20rem", transition: "color 0.15s" }}
                        className="hover:text-terracotta-dark"
                      >
                        {r.site_web!.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </td>
                    <td style={{ padding: "0.625rem 1rem", color: "#888", fontSize: "0.8125rem" }}>{r.ville}</td>
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
                          <input type="hidden" name="returnTo" value="/admin/cleanup" />
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
