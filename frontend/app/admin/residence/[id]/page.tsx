import { requireAuth } from "@/lib/admin-session";
import { updateResidenceAction, deleteResidenceAction } from "@/app/admin/actions";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

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

const inputStyle = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: "0.875rem",
  outline: "none",
  background: "#fff",
  transition: "border-color 0.15s",
  boxSizing: "border-box" as const,
  color: "#1a1a1a",
};

const labelStyle = {
  display: "block",
  fontSize: "0.7rem",
  color: "#aaa",
  fontWeight: 600 as const,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: "6px",
};

export default async function EditResidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { saved } = await searchParams;

  const { data: r } = await getSb()
    .from("residences")
    .select("*")
    .eq("id", parseInt(id))
    .single();

  if (!r) notFound();

  const fields = [
    { name: "nom",       label: "Nom",       value: r.nom,       type: "text" },
    { name: "ville",     label: "Ville",     value: r.ville,     type: "text" },
    { name: "adresse",   label: "Adresse",   value: r.adresse,   type: "text" },
    { name: "telephone", label: "Téléphone", value: r.telephone, type: "tel"  },
    { name: "site_web",  label: "Site web",  value: r.site_web,  type: "url"  },
  ];

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <a href="/admin/residences" style={{ fontSize: "0.8125rem", color: "#aaa", textDecoration: "none", transition: "color 0.15s" }} className="hover:text-marine">
          ← Résidences
        </a>
        <span style={{ color: "#ddd" }}>/</span>
        <span style={{ fontSize: "0.8125rem", color: "#ccc", fontFamily: "monospace" }}>#{r.id}</span>
      </div>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "#1C2B4A", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
            {r.nom}
          </h1>
          <p style={{ color: "#aaa", fontSize: "0.8125rem" }}>{r.ville}{r.region ? ` · ${r.region}` : ""}</p>
        </div>
        <a
          href={`https://www.place65plus.quebec/residence/${r.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.8125rem", color: "#2563eb", textDecoration: "none", transition: "color 0.15s", flexShrink: 0, marginTop: "4px" }}
          className="hover:text-blue-800"
        >
          Voir la fiche ↗
        </a>
      </div>

      {saved && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: "0.8125rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
          ✓ Modifications enregistrées.
        </div>
      )}

      {/* Google data (read-only) */}
      {(r.note_google || r.photo_url) && (
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {r.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.photo_url}
              alt={r.nom}
              style={{ width: "96px", height: "76px", objectFit: "cover", borderRadius: "0.5rem", flexShrink: 0 }}
            />
          )}
          <div style={{ fontSize: "0.8125rem", color: "#555" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "0.25rem" }}>
              {r.note_google && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ color: "#d97706" }}>⭐</span>
                  <strong style={{ color: "#1a1a1a" }}>{r.note_google}</strong>
                  <span style={{ color: "#aaa" }}>({r.nb_avis_google ?? 0} avis)</span>
                </span>
              )}
              {r.quality_score != null && (
                <span style={{ fontSize: "0.7rem", background: "#f0ede8", color: "#666", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>
                  Score qualité : {r.quality_score}
                </span>
              )}
            </div>
            {r.adresse && <p style={{ color: "#888", marginTop: "4px" }}>📍 {r.adresse}</p>}
            {r.latitude && (
              <p style={{ color: "#ccc", fontSize: "0.7rem", marginTop: "4px", fontFamily: "monospace" }}>
                {r.latitude}, {r.longitude}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit form */}
      <form
        action={updateResidenceAction}
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.875rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <input type="hidden" name="id" value={r.id} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.25rem", marginBottom: "1rem" }}>
          {fields.slice(0, 4).map(({ name, label, value, type }) => (
            <div key={name}>
              <label style={labelStyle}>{label}</label>
              <input
                name={name}
                type={type}
                defaultValue={value ?? ""}
                style={inputStyle}
                className="focus:border-marine/40"
              />
            </div>
          ))}
        </div>

        {/* Site web — full width */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>{fields[4].label}</label>
          <input
            name={fields[4].name}
            type={fields[4].type}
            defaultValue={fields[4].value ?? ""}
            style={inputStyle}
            className="focus:border-marine/40"
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Région</label>
          <select
            name="region"
            defaultValue={r.region ?? ""}
            style={{ ...inputStyle, cursor: "pointer" }}
            className="focus:border-marine/40"
          >
            <option value="">—</option>
            {REGIONS.map((reg) => <option key={reg} value={reg}>{reg}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            style={{ flex: 1, background: "#1C2B4A", color: "#fff", fontWeight: 600, padding: "0.75rem", borderRadius: "0.625rem", fontSize: "0.875rem", border: "none", cursor: "pointer", transition: "background 0.15s" }}
            className="hover:bg-marine-light"
          >
            Enregistrer les modifications
          </button>
          <a
            href="/admin/residences"
            style={{ padding: "0.75rem 1.25rem", border: "1px solid rgba(0,0,0,0.12)", color: "#666", fontSize: "0.875rem", fontWeight: 500, borderRadius: "0.625rem", textDecoration: "none", textAlign: "center", transition: "border-color 0.15s" }}
            className="hover:border-gray-400"
          >
            Annuler
          </a>
        </div>
      </form>

      {/* Danger zone */}
      <div style={{ marginTop: "1.5rem", background: "#fff8f8", border: "1px solid #fde8e8", borderRadius: "0.875rem", padding: "1.25rem 1.5rem" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b91c1c", marginBottom: "0.5rem", letterSpacing: "0.02em" }}>
          Zone dangereuse
        </p>
        <p style={{ fontSize: "0.75rem", color: "#cd5454", marginBottom: "1rem" }}>
          Cette action est irréversible. La fiche sera supprimée définitivement.
        </p>
        <form action={deleteResidenceAction}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="returnTo" value="/admin/residences" />
          <button
            type="submit"
            style={{ padding: "0.5rem 1rem", background: "#dc2626", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, borderRadius: "0.5rem", border: "none", cursor: "pointer", transition: "background 0.15s" }}
            className="hover:bg-red-700"
          >
            Supprimer cette fiche
          </button>
        </form>
      </div>
    </div>
  );
}
