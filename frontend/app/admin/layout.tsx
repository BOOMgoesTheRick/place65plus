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
      <body
        className={`${playfair.variable} ${dmSans.variable} min-h-screen antialiased`}
        style={{ background: "#F4F1EC", fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1a1a1a" }}
      >
        {authed && (
          <nav style={{ background: "#1C2B4A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <a href="/admin" className="flex items-center gap-2.5 shrink-0">
                  <span
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#fff", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}
                  >
                    Place 65+
                  </span>
                  <span style={{ color: "#E8C97A", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginTop: "2px" }}>
                    Admin
                  </span>
                </a>

                <div className="flex items-center gap-0.5">
                  {NAV_LINKS.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.5rem", transition: "all 0.15s" }}
                      onMouseOver={(e) => {
                        (e.target as HTMLElement).style.color = "#fff";
                        (e.target as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)";
                        (e.target as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/"
                  target="_blank"
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", transition: "color 0.15s" }}
                  className="hover:text-white/60"
                >
                  ↗ Site public
                </a>
                <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.12)" }} />
                <form action={logoutAction}>
                  <button
                    style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid transparent", transition: "all 0.15s", background: "transparent", cursor: "pointer" }}
                    className="hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10"
                  >
                    Déconnexion
                  </button>
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
