-- Add 6 MSSS service boolean columns
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS service_repas       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_soins       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_assistance  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_alimentation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_loisirs     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_securite    boolean DEFAULT false;
