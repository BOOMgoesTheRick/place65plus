-- ============================================================
-- momanetpopa.ca — Table principale des résidences
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS residences (
  id              SERIAL PRIMARY KEY,
  nom             TEXT NOT NULL,
  adresse         TEXT,
  ville           TEXT,
  region          TEXT,
  mrc             TEXT,
  code_postal     TEXT,
  telephone       TEXT,
  site_web        TEXT,
  categorie       TEXT,           -- catégorie MSSS (ex: "Certifié - catégorie 3")
  nb_unites       INTEGER,
  statut          TEXT DEFAULT 'certifiee',
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  note_google     DECIMAL(2, 1),
  nb_avis_google  INTEGER,
  photo_url       TEXT,
  prix_min        INTEGER,        -- prix minimum mensuel en $
  prix_max        INTEGER,        -- prix maximum mensuel en $
  description     TEXT,
  langue_service  TEXT DEFAULT 'francais',  -- francais, anglais, bilingue
  fiche_reclamee  BOOLEAN DEFAULT FALSE,
  tier            TEXT DEFAULT 'gratuit',   -- gratuit, standard, premium, vedette
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_residences_ville     ON residences(ville);
CREATE INDEX IF NOT EXISTS idx_residences_region    ON residences(region);
CREATE INDEX IF NOT EXISTS idx_residences_categorie ON residences(categorie);
CREATE INDEX IF NOT EXISTS idx_residences_tier      ON residences(tier);
CREATE INDEX IF NOT EXISTS idx_residences_geo       ON residences USING gist (
  point(longitude, latitude)
);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER residences_updated_at
  BEFORE UPDATE ON residences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Politique RLS (Row Level Security) — lecture publique
ALTER TABLE residences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des résidences"
  ON residences FOR SELECT
  USING (true);

CREATE POLICY "Écriture réservée au service role"
  ON residences FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Requêtes de vérification (à exécuter après l'import)
-- ============================================================

-- SELECT COUNT(*) FROM residences;
-- SELECT region, COUNT(*) FROM residences GROUP BY region ORDER BY COUNT(*) DESC;
-- SELECT COUNT(*) FROM residences WHERE latitude IS NOT NULL;
-- SELECT COUNT(*) FROM residences WHERE photo_url IS NOT NULL;
