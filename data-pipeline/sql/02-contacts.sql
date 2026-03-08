-- Table pour stocker les leads (formulaires de contact)
-- Exécuter dans : Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS contacts (
  id           SERIAL PRIMARY KEY,
  residence_id INTEGER REFERENCES residences(id) ON DELETE SET NULL,
  nom          TEXT NOT NULL,
  email        TEXT NOT NULL,
  telephone    TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Lecture réservée au service_role (admin seulement)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Écriture publique des contacts"
  ON contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Lecture réservée au service role"
  ON contacts FOR SELECT
  USING (auth.role() = 'service_role');
