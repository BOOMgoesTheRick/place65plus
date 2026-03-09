import { isAuthenticated } from "@/lib/admin-session";
import { logoutAction } from "@/app/admin/actions";

export const metadata = { title: "Admin — Place 65+" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();

  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen font-sans">
        {authed && (
          <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="font-bold text-white">Place 65+ <span className="text-gray-400 font-normal">Admin</span></span>
              <a href="/admin" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
              <a href="/admin/residences" className="text-gray-300 hover:text-white transition-colors">Résidences</a>
              <a href="/admin/cleanup" className="text-gray-300 hover:text-white transition-colors">Nettoyage</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" target="_blank" className="text-gray-400 hover:text-white transition-colors text-xs">→ Site public</a>
              <form action={logoutAction}>
                <button className="text-gray-400 hover:text-red-400 transition-colors">Déconnexion</button>
              </form>
            </div>
          </nav>
        )}
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
