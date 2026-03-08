-- ============================================================
-- 04-search-unaccent.sql — Recherche insensible aux accents
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Activer l'extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper immutable nécessaire pour les colonnes générées
-- (unaccent() seule n'est pas IMMUTABLE dans PostgreSQL)
CREATE OR REPLACE FUNCTION unaccent_immutable(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT unaccent($1)
$$;

-- Ajouter des colonnes de recherche normalisées (minuscules + sans accents)
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS nom_search    text GENERATED ALWAYS AS (lower(unaccent_immutable(nom)))    STORED,
  ADD COLUMN IF NOT EXISTS ville_search  text GENERATED ALWAYS AS (lower(unaccent_immutable(ville)))  STORED,
  ADD COLUMN IF NOT EXISTS region_search text GENERATED ALWAYS AS (lower(unaccent_immutable(region))) STORED;

-- Index pour accélérer la recherche
CREATE INDEX IF NOT EXISTS idx_residences_nom_search    ON residences (nom_search);
CREATE INDEX IF NOT EXISTS idx_residences_ville_search  ON residences (ville_search);
CREATE INDEX IF NOT EXISTS idx_residences_region_search ON residences (region_search);
