-- Mark suspicious residences as reviewed/legit so they are hidden from cleanup
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS is_reviewed boolean DEFAULT false;
