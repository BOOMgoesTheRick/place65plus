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
    { name: "nom", label: "Nom", value: r.nom, type: "text" },
    { name: "ville", label: "Ville", value: r.ville, type: "text" },
    { name: "adresse", label: "Adresse", value: r.adresse, type: "text" },
    { name: "telephone", label: "Téléphone", value: r.telephone, type: "tel" },
    { name: "site_web", label: "Site web", value: r.site_web, type: "url" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/residences" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Résidences
        </a>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-600">#{r.id}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{r.nom}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{r.ville} · {r.region}</p>
        </div>
        <a href={`https://www.place65plus.quebec/residence/${r.id}`} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:text-blue-700 transition-colors">
          Voir la fiche ↗
        </a>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6">
          Modifications enregistrées.
        </div>
      )}

      {/* Google data (read-only) */}
      {(r.note_google || r.photo_url) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex gap-4 items-start">
          {r.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.photo_url.replace(/key=[^&]+/, `key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`)}
              alt={r.nom} className="w-24 h-20 object-cover rounded-lg shrink-0" />
          )}
          <div className="text-sm text-gray-600 space-y-1">
            {r.note_google && <p>⭐ {r.note_google} ({r.nb_avis_google ?? 0} avis Google)</p>}
            {r.adresse && <p>📍 {r.adresse}</p>}
            {r.latitude && <p className="text-xs text-gray-400">{r.latitude}, {r.longitude}</p>}
            <p className="text-xs text-gray-400">Quality score: {r.quality_score ?? "—"}</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      <form action={updateResidenceAction} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <input type="hidden" name="id" value={r.id} />

        {fields.map(({ name, label, value, type }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              name={name}
              type={type}
              defaultValue={value ?? ""}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Région</label>
          <select name="region" defaultValue={r.region ?? ""}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none bg-white transition-colors">
            <option value="">—</option>
            {REGIONS.map((reg) => <option key={reg} value={reg}>{reg}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Enregistrer
          </button>
          <a href="/admin/residences"
            className="px-6 py-2.5 border border-gray-200 hover:border-gray-400 text-gray-600 font-medium rounded-xl transition-colors text-sm text-center">
            Annuler
          </a>
        </div>
      </form>

      {/* Delete */}
      <div className="mt-6 p-4 border border-red-100 rounded-xl bg-red-50">
        <p className="text-sm font-medium text-red-700 mb-3">Zone dangereuse</p>
        <form action={deleteResidenceAction}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="returnTo" value="/admin/residences" />
          <button type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Supprimer cette fiche
          </button>
        </form>
      </div>
    </div>
  );
}
