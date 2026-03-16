import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place 65+ — Bientôt / Coming Soon",
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const fr = locale === "fr";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: "2.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#3D5A8A",
            textTransform: "uppercase",
          }}
        >
          Place 65+
        </span>
      </div>

      <div style={{ width: "2rem", height: "2px", background: "#C4593A", marginBottom: "2.5rem", borderRadius: "1px" }} />

      <h1
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 700,
          color: "#2A3F6B",
          lineHeight: 1.2,
          marginBottom: "1.25rem",
          maxWidth: "600px",
        }}
      >
        {fr ? "Bientôt disponible" : "Coming Soon"}
      </h1>

      <p
        style={{
          fontSize: "1.05rem",
          color: "#4B5563",
          maxWidth: "420px",
          lineHeight: 1.7,
          marginBottom: "3rem",
        }}
      >
        {fr
          ? "Nous travaillons à améliorer votre expérience. Revenez nous voir bientôt."
          : "We're working on improving your experience. Check back soon."}
      </p>

      <a
        href={fr ? "/en" : "/fr"}
        style={{
          fontSize: "0.8rem",
          color: "#6B7280",
          textDecoration: "none",
          letterSpacing: "0.05em",
          borderBottom: "1px solid #9CA3AF",
          paddingBottom: "2px",
        }}
      >
        {fr ? "English" : "Français"}
      </a>
    </main>
  );
}
