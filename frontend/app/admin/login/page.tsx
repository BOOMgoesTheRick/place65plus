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
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          style={{
            background: "#1C2B4A",
            borderRadius: "1.25rem",
            padding: "2.5rem",
            boxShadow: "0 24px 48px rgba(28,43,74,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo */}
          <div className="mb-8">
            <p
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#fff",
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              Place 65+
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>
              Administration
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.25)",
                color: "#fca5a5",
                fontSize: "0.8125rem",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
              }}
            >
              Mot de passe incorrect.
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label
                style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: "8px" }}
              >
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                autoFocus
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 0.15s, background 0.15s",
                  boxSizing: "border-box",
                }}
                className="focus:border-or/60 focus:bg-white/10 placeholder-white/20"
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                background: "#C4593A",
                color: "#fff",
                fontWeight: 600,
                padding: "0.8125rem",
                borderRadius: "0.75rem",
                fontSize: "0.9375rem",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s",
                marginTop: "0.5rem",
              }}
              className="hover:bg-terracotta-dark"
            >
              Connexion →
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "rgba(0,0,0,0.3)", fontSize: "0.75rem", marginTop: "1.5rem" }}>
          place65plus.quebec
        </p>
      </div>
    </div>
  );
}
