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

  const stats = [
    { label: "Total résidences", value: total?.toLocaleString("fr-CA") ?? "—", color: "bg-blue-50 text-blue-700" },
    { label: "Avec téléphone", value: withPhone?.toLocaleString("fr-CA") ?? "—", sub: pct(withPhone), color: "bg-green-50 text-green-700" },
    { label: "Avec site web", value: withWebsite?.toLocaleString("fr-CA") ?? "—", sub: pct(withWebsite), color: "bg-green-50 text-green-700" },
    { label: "Avec Google", value: withGoogle?.toLocaleString("fr-CA") ?? "—", sub: pct(withGoogle), color: "bg-amber-50 text-amber-700" },
    { label: "Avec photo", value: withPhoto?.toLocaleString("fr-CA") ?? "—", sub: pct(withPhoto), color: "bg-amber-50 text-amber-700" },
    { label: "Incomplètes", value: incomplete?.toLocaleString("fr-CA") ?? "—", sub: pct(incomplete), color: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble de la base de données</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/residences" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
            Gérer les résidences →
          </a>
          <a href="/admin/cleanup" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            Nettoyage →
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-xs opacity-70">{s.sub}</p>}
            <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Region breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Résidences par région</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {REGIONS.filter(r => regionCounts[r]).map((region) => {
            const count = regionCounts[region] ?? 0;
            const pctRegion = total ? (count / total) * 100 : 0;
            return (
              <div key={region} className="px-6 py-3 flex items-center gap-4">
                <span className="text-sm text-gray-700 w-64 truncate">{region}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${pctRegion}%` }} />
                </div>
                <a
                  href={`/admin/residences?region=${encodeURIComponent(region)}`}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 w-16 text-right transition-colors"
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
