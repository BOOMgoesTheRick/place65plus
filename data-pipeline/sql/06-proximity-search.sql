-- ============================================================
-- 06-proximity-search.sql — Recherche par proximité géographique
-- Retourne les IDs des résidences dans un rayon autour d'une ville
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION residences_near_city(
  city_query text,
  radius_km float DEFAULT 30
)
RETURNS TABLE(id int) AS $$
DECLARE
  city_lat float;
  city_lng float;
BEGIN
  -- Trouver le centroïde de la ville via la moyenne des résidences connues
  SELECT AVG(latitude), AVG(longitude)
  INTO city_lat, city_lng
  FROM residences
  WHERE ville_search = lower(unaccent_immutable(city_query))
    AND latitude IS NOT NULL AND longitude IS NOT NULL;

  -- Si la ville n'existe pas dans la base, retourner vide
  IF city_lat IS NULL THEN
    RETURN;
  END IF;

  -- Retourner les IDs dans le rayon (formule de Haversine)
  RETURN QUERY
  SELECT r.id
  FROM residences r
  WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    AND (6371 * acos(
      LEAST(1.0,
        cos(radians(city_lat)) * cos(radians(r.latitude)) *
        cos(radians(r.longitude) - radians(city_lng)) +
        sin(radians(city_lat)) * sin(radians(r.latitude))
      )
    )) <= radius_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recherche par coordonnées directes (pour villes sans résidences dans la DB)
CREATE OR REPLACE FUNCTION residences_near_point(
  lat float, lng float, radius_km float DEFAULT 30
)
RETURNS TABLE(id int) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id FROM residences r
  WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    AND (6371 * acos(LEAST(1.0,
      cos(radians(lat)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(r.latitude))
    ))) <= radius_km;
END;
$$ LANGUAGE plpgsql STABLE;
