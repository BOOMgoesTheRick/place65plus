import { loginAction } from "@/app/admin/actions";
import { isAuthenticated } from "@/lib/admin-session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticated()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Place 65+</h1>
        <p className="text-sm text-gray-400 mb-8">Connexion admin</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
            Mot de passe incorrect.
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Connexion →
          </button>
        </form>
      </div>
    </div>
  );
}
