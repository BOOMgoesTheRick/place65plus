-- Ajouter la colonne de suivi des mises à jour Google
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS refreshed_at timestamptz DEFAULT NULL;
