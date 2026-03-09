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

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nettoyage</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fiches incomplètes et suspectes</p>
      </div>

      {sp.deleted && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          {sp.deleted} fiche{parseInt(sp.deleted) > 1 ? "s" : ""} supprimée{parseInt(sp.deleted) > 1 ? "s" : ""}.
        </div>
      )}

      {/* Incomplete section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Fiches incomplètes</h2>
            <p className="text-sm text-gray-400">Sans téléphone, sans site web, sans données Google — {incomplete.length} fiche{incomplete.length !== 1 ? "s" : ""}</p>
          </div>
          {incomplete.length > 0 && (
            <form action={bulkDeleteAction}>
              <input type="hidden" name="ids" value={incompleteIds} />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={undefined}
              >
                Supprimer tout ({incomplete.length})
              </button>
            </form>
          )}
        </div>

        {incomplete.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-6 text-center text-sm text-green-700">
            Aucune fiche incomplète.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-14">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-40">Ville</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-40">Région</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incomplete.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">#{r.id}</td>
                    <td className="px-4 py-2.5">
                      <a href={`/admin/residence/${r.id}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                        {r.nom}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.ville}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs truncate max-w-[10rem]">{r.region}</td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={deleteResidenceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="returnTo" value="/admin/cleanup" />
                        <button type="submit"
                          className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-100 hover:border-red-300 rounded px-2 py-0.5 transition-colors">
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

      {/* Suspicious section */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Domaines suspects</h2>
          <p className="text-sm text-gray-400">Sites web avec mots-clés immobiliers dans le domaine — {suspicious.length} fiche{suspicious.length !== 1 ? "s" : ""}</p>
        </div>

        {suspicious.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-6 text-center text-sm text-green-700">
            Aucun domaine suspect.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-14">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Site web</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-36">Ville</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suspicious.map((r) => (
                  <tr key={r.id} className="bg-orange-50">
                    <td className="px-4 py-2.5 text-gray-400 text-xs">#{r.id}</td>
                    <td className="px-4 py-2.5">
                      <a href={`/admin/residence/${r.id}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                        {r.nom}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={r.site_web!} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-800 truncate block max-w-xs transition-colors">
                        {r.site_web!.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.ville}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/admin/residence/${r.id}`}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                          Éditer
                        </a>
                        <form action={deleteResidenceAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="returnTo" value="/admin/cleanup" />
                          <button type="submit"
                            className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-100 hover:border-red-300 rounded px-2 py-0.5 transition-colors">
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
