import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const SUSPICIOUS_KEYWORDS = [
  "habitations","condo","condos","appartement","appartements","immobilier",
  "locatif","logement","logements","lofts","realty","investissement",
  "real-estate","realestate","rental","location","properties",
];

function isSuspicious(url: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SUSPICIOUS_KEYWORDS.some(k => host.includes(k));
  } catch { return false; }
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function deleteResidence(formData: FormData) {
  "use server";
  const secret = formData.get("secret") as string;
  const id = formData.get("id") as string;
  const returnTo = formData.get("returnTo") as string;

  if (secret !== process.env.ADMIN_SECRET) return redirect("/admin?error=auth");

  const sb = getServiceClient();
  const { error } = await sb.from("residences").delete().eq("id", parseInt(id));
  if (error) return redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const base = returnTo || "/admin";
  redirect(`${base}&deleted=${id}`);
}

async function lookupResidence(formData: FormData) {
  "use server";
  const secret = formData.get("secret") as string;
  const raw = formData.get("id") as string;

  if (secret !== process.env.ADMIN_SECRET) return redirect("/admin?error=auth");

  const match = raw.match(/(\d+)\/?$/);
  const id = match?.[1];
  if (!id) return redirect("/admin?error=invalid");
  redirect(`/admin?id=${id}&secret=${encodeURIComponent(secret)}`);
}

async function authToList(formData: FormData) {
  "use server";
  const secret = formData.get("secret") as string;
  if (secret !== process.env.ADMIN_SECRET) return redirect("/admin?error=auth");
  redirect(`/admin?mode=list&secret=${encodeURIComponent(secret)}`);
}

const PAGE_SIZE = 50;

interface AdminPageProps {
  searchParams: Promise<{
    id?: string; secret?: string; error?: string; deleted?: string;
    mode?: string; page?: string; q?: string; flag?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const sp = await searchParams;
  const { id, secret, error, deleted, mode, q, flag } = sp;
  const page = parseInt(sp.page ?? "1", 10);

  const authed = secret && secret === process.env.ADMIN_SECRET;

  // ── LIST MODE ──────────────────────────────────────────────────────────────
  if (mode === "list" && authed) {
    const sb = getServiceClient();

    let query = sb
      .from("residences")
      .select("id, nom, ville, region, site_web", { count: "exact" })
      .not("site_web", "is", null);

    if (q) query = query.ilike("nom", `%${q}%`);
    if (flag === "1") {
      // Filter to suspicious ones — we fetch all and filter in JS (site_web domain check)
      // Supabase doesn't support OR-ilike across a domain substring easily, so fetch more
      query = query.limit(2000);
    } else {
      query = query
        .order("id", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    }

    const { data: rows, count } = await query;

    let display = rows ?? [];
    let total = count ?? 0;

    if (flag === "1") {
      display = display.filter(r => isSuspicious(r.site_web));
      total = display.length;
      // paginate in JS
      const start = (page - 1) * PAGE_SIZE;
      display = display.slice(start, start + PAGE_SIZE);
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildUrl = (p: number) => {
      const params = new URLSearchParams({ mode: "list", secret: secret!, page: String(p) });
      if (q) params.set("q", q);
      if (flag) params.set("flag", flag);
      return `/admin?${params.toString()}`;
    };

    const listBase = `/admin?mode=list&secret=${encodeURIComponent(secret!)}${flag ? "&flag=1" : ""}`;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin — Liste des fiches</h1>
              <p className="text-sm text-gray-400">{total} résidences avec site web</p>
            </div>
            <a href="/admin" className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5">
              ← Retour
            </a>
          </div>

          {deleted && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
              Résidence #{deleted} supprimée.
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <form method="get" className="flex gap-2">
              <input type="hidden" name="mode" value="list" />
              <input type="hidden" name="secret" value={secret!} />
              {flag && <input type="hidden" name="flag" value="1" />}
              <input
                name="q"
                defaultValue={q}
                placeholder="Filtrer par nom..."
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
              <button type="submit" className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg">Filtrer</button>
            </form>
            <a
              href={`/admin?mode=list&secret=${encodeURIComponent(secret!)}${flag === "1" ? "" : "&flag=1"}`}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                flag === "1"
                  ? "bg-orange-100 border-orange-300 text-orange-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
            >
              ⚠️ Suspects seulement {flag === "1" ? `(${total})` : ""}
            </a>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-16">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-36">Ville</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Site web</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {display.map((r) => {
                  const suspicious = isSuspicious(r.site_web);
                  return (
                    <tr key={r.id} className={suspicious ? "bg-orange-50" : ""}>
                      <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <a
                          href={`https://www.place65plus.quebec/residence/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {r.nom}
                          {suspicious && <span className="ml-2 text-xs text-orange-600 font-normal">⚠️ suspect</span>}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.ville}</td>
                      <td className="px-4 py-3">
                        {r.site_web && (
                          <a
                            href={r.site_web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:underline truncate block max-w-xs ${suspicious ? "text-orange-600" : "text-blue-500"}`}
                          >
                            {r.site_web.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteResidence}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="secret" value={secret!} />
                          <input type="hidden" name="returnTo" value={buildUrl(page)} />
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 rounded px-2 py-1 transition-colors"
                            onClick={undefined}
                          >
                            Suppr.
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {display.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Aucun résultat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <a href={buildUrl(page - 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:border-gray-400">
                  ← Précédent
                </a>
              )}
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              {page < totalPages && (
                <a href={buildUrl(page + 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:border-gray-400">
                  Suivant →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DETAIL MODE ────────────────────────────────────────────────────────────
  let residence = null;
  if (id && authed) {
    const sb = getServiceClient();
    const { data } = await sb
      .from("residences")
      .select("id, nom, ville, region, telephone, site_web, note_google, statut, photo_url")
      .eq("id", parseInt(id))
      .single();
    residence = data;
  }

  // ── LOGIN / LOOKUP MODE ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin — Place 65+</h1>
        <p className="text-sm text-gray-400 mb-8">Suppression de fiches</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error === "auth" ? "Mot de passe incorrect." : error === "invalid" ? "ID invalide." : error}
          </div>
        )}

        {deleted && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6">
            Résidence #{deleted} supprimée avec succès.
          </div>
        )}

        {!residence ? (
          <div className="space-y-6">
            {/* Lookup by ID */}
            <form action={lookupResidence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL ou ID de la résidence
                </label>
                <input
                  name="id"
                  type="text"
                  placeholder="https://place65plus.quebec/residence/1234 ou 1234"
                  defaultValue={id ?? ""}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe admin
                </label>
                <input
                  name="secret"
                  type="password"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Rechercher par ID
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">ou</div>
            </div>

            {/* List view */}
            <form action={authToList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe admin
                </label>
                <input
                  name="secret"
                  type="password"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Voir toutes les fiches avec site web →
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {residence.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={residence.photo_url} alt={residence.nom} className="w-full h-40 object-cover rounded-xl" />
            )}
            <div>
              <p className="text-xs text-gray-400 mb-1">ID #{residence.id}</p>
              <h2 className="text-xl font-bold text-gray-900">{residence.nom}</h2>
              <p className="text-gray-500">{residence.ville}{residence.region ? `, ${residence.region}` : ""}</p>
              {residence.note_google && (
                <p className="text-sm text-amber-500 font-medium mt-1">★ {residence.note_google}</p>
              )}
              {residence.telephone && <p className="text-sm text-gray-500 mt-1">{residence.telephone}</p>}
              {residence.site_web && (
                <a href={residence.site_web} target="_blank" rel="noopener noreferrer"
                  className={`text-sm hover:underline break-all ${isSuspicious(residence.site_web) ? "text-orange-500 font-medium" : "text-blue-500"}`}>
                  {residence.site_web}
                  {isSuspicious(residence.site_web) && " ⚠️"}
                </a>
              )}
            </div>

            <div className="flex gap-3">
              <a
                href="/admin"
                className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 font-medium text-center py-2.5 rounded-xl transition-colors text-sm"
              >
                ← Annuler
              </a>
              <form action={deleteResidence} className="flex-1">
                <input type="hidden" name="id" value={residence.id} />
                <input type="hidden" name="secret" value={secret} />
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
