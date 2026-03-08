-- ============================================================
-- 05-quality-score.sql — Score de qualité pour le classement
-- Photo + Note Google + Nombre d'avis = score composite
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS quality_score int GENERATED ALWAYS AS (
    -- Photo présente : +40 pts (critère le plus visible)
    (CASE WHEN photo_url IS NOT NULL THEN 40 ELSE 0 END) +
    -- Note Google : 0–20 pts (ex: 4.5 → 18 pts)
    (CASE WHEN note_google IS NOT NULL THEN ROUND(note_google * 4)::int ELSE 0 END) +
    -- Nombre d'avis : 0–20 pts (chaque tranche de 10 avis = 1 pt, max 20)
    (CASE WHEN nb_avis_google IS NOT NULL THEN LEAST(FLOOR(nb_avis_google / 10), 20)::int ELSE 0 END)
  ) STORED;

-- Index pour accélérer le tri
CREATE INDEX IF NOT EXISTS idx_residences_quality_score ON residences (quality_score DESC);
