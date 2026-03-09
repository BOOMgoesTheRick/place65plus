import { Playfair_Display, DM_Sans } from "next/font/google";
import { isAuthenticated } from "@/lib/admin-session";
import { logoutAction } from "@/app/admin/actions";
import "../globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = { title: "Admin — Place 65+" };

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/residences", label: "Résidences" },
  { href: "/admin/cleanup", label: "Nettoyage" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();

  return (
    <html lang="fr">
      <head>
        <style>{`
          .admin-nav-link {
            color: rgba(255,255,255,0.55);
            font-size: 0.875rem;
            padding: 0.375rem 0.75rem;
            border-radius: 0.5rem;
            text-decoration: none;
            transition: color 0.15s, background 0.15s;
          }
          .admin-nav-link:hover {
            color: #fff;
            background: rgba(255,255,255,0.1);
          }
          .admin-logout-btn {
            color: rgba(255,255,255,0.35);
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid transparent;
            background: transparent;
            cursor: pointer;
            transition: color 0.15s, border-color 0.15s, background 0.15s;
          }
          .admin-logout-btn:hover {
            color: #f87171;
            border-color: rgba(248,113,113,0.3);
            background: rgba(248,113,113,0.08);
          }
          .admin-site-link {
            color: rgba(255,255,255,0.3);
            font-size: 0.75rem;
            text-decoration: none;
            transition: color 0.15s;
          }
          .admin-site-link:hover { color: rgba(255,255,255,0.7); }
        `}</style>
      </head>
      <body
        className={`${playfair.variable} ${dmSans.variable} min-h-screen antialiased`}
        style={{ background: "#F4F1EC", fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1a1a1a" }}
      >
        {authed && (
          <nav style={{ background: "#1C2B4A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <a href="/admin" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: "none" }}>
                  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#fff", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>
                    Place 65+
                  </span>
                  <span style={{ color: "#E8C97A", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginTop: "2px" }}>
                    Admin
                  </span>
                </a>

                <div className="flex items-center gap-0.5">
                  {NAV_LINKS.map(({ href, label }) => (
                    <a key={href} href={href} className="admin-nav-link">
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a href="/" target="_blank" className="admin-site-link">
                  ↗ Site public
                </a>
                <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.12)" }} />
                <form action={logoutAction}>
                  <button className="admin-logout-btn">Déconnexion</button>
                </form>
              </div>
            </div>
          </nav>
        )}
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
