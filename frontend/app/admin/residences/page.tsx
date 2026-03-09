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

  // Fetch more when suspicious filter is on (need to filter in JS too)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résidences</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString("fr-CA")} résultat{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {sp.deleted && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          Résidence #{sp.deleted} supprimée.
        </div>
      )}
      {sp.updated && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3 mb-4">
          Résidence #{sp.updated} mise à jour.
        </div>
      )}

      {/* Filters */}
      <form method="get" className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">Nom ou ville</label>
          <input name="q" defaultValue={q} placeholder="Rechercher..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Région</label>
          <select name="region" defaultValue={region}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
            <option value="">Toutes</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {[
            { name: "no_phone", label: "Sans tél.", checked: noPhone },
            { name: "no_website", label: "Sans site", checked: noWebsite },
            { name: "no_google", label: "Sans Google", checked: noGoogle },
            { name: "suspicious", label: "⚠️ Suspects", checked: suspiciousOnly },
          ].map(({ name, label, checked }) => (
            <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name={name} value="1" defaultChecked={checked}
                className="rounded" />
              {label}
            </label>
          ))}
        </div>
        <button type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
          Filtrer
        </button>
        {(q || region || noPhone || noWebsite || noGoogle || suspiciousOnly) && (
          <a href="/admin/residences" className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:border-gray-400 transition-colors">
            Réinitialiser
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-14">ID</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Nom</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-36">Ville</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-32">Région</th>
              <th className="text-center px-3 py-3 text-gray-500 font-medium w-10">📞</th>
              <th className="text-center px-3 py-3 text-gray-500 font-medium w-10">🌐</th>
              <th className="text-center px-3 py-3 text-gray-500 font-medium w-10">⭐</th>
              <th className="text-center px-3 py-3 text-gray-500 font-medium w-10">📷</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const suspicious = isSuspicious(r.site_web);
              return (
                <tr key={r.id} className={suspicious ? "bg-orange-50" : ""}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">#{r.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <a href={`/admin/residence/${r.id}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-1">
                        {r.nom}
                      </a>
                      {suspicious && <span className="text-xs text-orange-500 shrink-0">⚠️</span>}
                    </div>
                    {r.site_web && (
                      <a href={r.site_web} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-blue-500 truncate block max-w-xs transition-colors">
                        {r.site_web.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{r.ville}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs truncate max-w-[8rem]">{r.region}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.telephone ? "text-green-500" : "text-gray-200"}>●</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.site_web ? "text-green-500" : "text-gray-200"}>●</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.note_google ? "text-amber-400" : "text-gray-200"}>●</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={r.photo_url ? "text-blue-400" : "text-gray-200"}>●</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/admin/residence/${r.id}`}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                        Éditer
                      </a>
                      <form action={deleteResidenceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit"
                          className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-100 hover:border-red-300 rounded px-2 py-0.5 transition-colors"
                          onClick={undefined}>
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
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">Aucun résultat</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <a href={buildUrl(page - 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:border-gray-400 transition-colors">
              ← Précédent
            </a>
          )}
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <a href={buildUrl(page + 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:border-gray-400 transition-colors">
              Suivant →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
