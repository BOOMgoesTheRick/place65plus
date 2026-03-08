import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

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

  if (secret !== process.env.ADMIN_SECRET) return redirect("/admin?error=auth");

  const sb = getServiceClient();
  const { error } = await sb.from("residences").delete().eq("id", parseInt(id));
  if (error) return redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin?deleted=${id}`);
}

async function lookupResidence(formData: FormData) {
  "use server";
  const secret = formData.get("secret") as string;
  const raw = formData.get("id") as string;

  if (secret !== process.env.ADMIN_SECRET) return redirect("/admin?error=auth");

  // Accept full URL or just ID
  const match = raw.match(/(\d+)\/?$/);
  const id = match?.[1];
  if (!id) return redirect("/admin?error=invalid");
  redirect(`/admin?id=${id}&secret=${encodeURIComponent(secret)}`);
}

interface AdminPageProps {
  searchParams: Promise<{ id?: string; secret?: string; error?: string; deleted?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const sp = await searchParams;
  const { id, secret, error, deleted } = sp;

  let residence = null;
  if (id && secret && secret === process.env.ADMIN_SECRET) {
    const sb = getServiceClient();
    const { data } = await sb
      .from("residences")
      .select("id, nom, ville, region, telephone, site_web, note_google, statut, photo_url")
      .eq("id", parseInt(id))
      .single();
    residence = data;
  }

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
              Rechercher
            </button>
          </form>
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
                <a href={residence.site_web} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">
                  {residence.site_web}
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
