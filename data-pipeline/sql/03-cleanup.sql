-- ============================================================
-- 03-cleanup.sql — Nettoyage des doublons et non-RPA
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : Aperçu des doublons (prévisualisation)
-- ============================================================
-- Affiche les groupes avec plusieurs entrées identiques (nom+ville)
SELECT
  lower(trim(nom)) AS nom_norm,
  lower(trim(ville)) AS ville_norm,
  COUNT(*) AS nb,
  array_agg(id ORDER BY id) AS ids
FROM residences
GROUP BY lower(trim(nom)), lower(trim(ville))
HAVING COUNT(*) > 1
ORDER BY nb DESC;


-- ============================================================
-- ÉTAPE 2 : Supprimer les doublons (garder le plus complet)
-- Priorité : a une note Google > a une photo > a un téléphone > id le plus bas
-- ============================================================
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(nom)), lower(trim(ville))
      ORDER BY
        (note_google  IS NOT NULL)::int DESC,
        (photo_url    IS NOT NULL)::int DESC,
        (telephone    IS NOT NULL)::int DESC,
        (adresse      IS NOT NULL)::int DESC,
        id ASC
    ) AS rn
  FROM residences
)
DELETE FROM residences
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);


-- ============================================================
-- ÉTAPE 3 : Aperçu des non-RPA potentiels
-- Cherche des mots-clés dans le nom qui suggèrent un lieu non-RPA
-- ============================================================
SELECT id, nom, ville, note_google, nb_avis_google
FROM residences
WHERE
  lower(nom) SIMILAR TO '%(hotel|hôtel|motel|auberge|restaurant|café|cafe|épicerie|pharmacie|clinique|école|eglise|église|parc industriel|garage|station|cégep|college|université|brasserie|pizzeria|banque|caisse|dépanneur|salon|spa|boutique|marché)%'
ORDER BY nom;


-- ============================================================
-- ÉTAPE 4 : Supprimer les non-RPA évidents (mots-clés métier)
-- ⚠️  Prévisualisez avec l'étape 3 avant d'exécuter celle-ci
-- ============================================================
DELETE FROM residences
WHERE
  lower(nom) SIMILAR TO '%(hotel|hôtel|motel|auberge|restaurant|café|cafe|épicerie|pharmacie|clinique|école|eglise|église|parc industriel|garage|station|cégep|college|université|brasserie|pizzeria|banque|caisse|dépanneur|salon|spa|boutique|marché)%';


-- ============================================================
-- ÉTAPE 5 : Entrées suspectes — Google a matché un mauvais lieu
-- Places avec un très faible nombre d'avis ET une note inhabituelle
-- (une vraie RPA a en général au moins quelques avis)
-- ============================================================
SELECT id, nom, ville, note_google, nb_avis_google, photo_url
FROM residences
WHERE
  note_google IS NOT NULL
  AND nb_avis_google < 3  -- très peu d'avis = probablement mauvais match Google
ORDER BY nb_avis_google ASC;


-- ============================================================
-- ÉTAPE 6 : Retirer les données Google des mauvais matchs
-- (réinitialise note/photo/avis pour ces entrées — ne les supprime pas)
-- ============================================================
UPDATE residences
SET
  note_google    = NULL,
  nb_avis_google = NULL,
  photo_url      = NULL,
  site_web       = NULL
WHERE
  note_google IS NOT NULL
  AND nb_avis_google < 3;


-- ============================================================
-- ÉTAPE 7 : Aperçu des faux matchs Google (même photo = même lieu trouvé)
-- Si plusieurs résidences ont la même photo_url → Google a retourné le même
-- résultat pour toutes → les données Google sont invalides pour ce groupe
-- ============================================================
SELECT
  photo_url,
  COUNT(*) AS nb,
  array_agg(nom ORDER BY nom) AS noms
FROM residences
WHERE photo_url IS NOT NULL
GROUP BY photo_url
HAVING COUNT(*) > 1
ORDER BY nb DESC;


-- ============================================================
-- ÉTAPE 8 : Réinitialiser les données Google des faux matchs
-- Efface note/photo/avis/tel pour tout groupe partageant la même photo
-- ⚠️  Prévisualisez avec l'étape 7 avant d'exécuter
-- ============================================================
UPDATE residences
SET
  note_google    = NULL,
  nb_avis_google = NULL,
  photo_url      = NULL,
  telephone      = NULL,
  site_web       = NULL
WHERE photo_url IN (
  SELECT photo_url
  FROM residences
  WHERE photo_url IS NOT NULL
  GROUP BY photo_url
  HAVING COUNT(*) > 1
);


-- ============================================================
-- ÉTAPE 9 : Résumé final
-- ============================================================
SELECT
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE note_google IS NOT NULL)   AS avec_note_google,
  COUNT(*) FILTER (WHERE photo_url   IS NOT NULL)   AS avec_photo,
  COUNT(*) FILTER (WHERE telephone   IS NOT NULL)   AS avec_telephone,
  COUNT(*) FILTER (WHERE nb_avis_google >= 10)      AS avis_10_plus,
  COUNT(*) FILTER (WHERE nb_avis_google >= 100)     AS avis_100_plus
FROM residences;
