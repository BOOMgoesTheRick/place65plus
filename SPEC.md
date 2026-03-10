# place65plus.quebec — Spécification finale

## Vue d'ensemble

Annuaire des résidences privées pour aînés (RPAs) au Québec. Permet aux familles de trouver une résidence par ville, région ou proximité géographique, avec filtres par services et note Google.

- **URL:** https://place65plus.quebec
- **Repo:** https://github.com/BOOMgoesTheRick/place65plus
- **Déploiement:** Vercel (auto-deploy sur push master)
- **Base de données:** Supabase (PostgreSQL)

---

## Architecture

```
C:\web\residence\
├── frontend/          # Next.js 16 App Router
└── data-pipeline/     # Scripts Node.js d'import et maintenance
```

---

## Base de données (Supabase)

### Table `residences`

| Colonne | Type | Description |
|---|---|---|
| id | int | Clé primaire |
| nom | text | Nom de la résidence |
| ville | text | Ville |
| region | text | Région administrative |
| adresse | text | Adresse complète |
| telephone | text | Numéro de téléphone |
| site_web | text | URL du site web |
| latitude | float | Coordonnée GPS |
| longitude | float | Coordonnée GPS |
| categorie | text | Catégorie K10 (ex: RPA) |
| note_google | float | Note Google (0–5) |
| nb_avis_google | int | Nombre d'avis Google |
| photo_url | text | URL photo Google Places (contient API key) |
| service_repas | bool | Service de repas |
| service_soins | bool | Soins infirmiers |
| service_assistance | bool | Assistance personnelle |
| service_alimentation | bool | Aide à l'alimentation |
| service_loisirs | bool | Activités et loisirs |
| service_securite | bool | Sécurité / surveillance |
| quality_score | int | Score calculé (0–80) |
| nom_search | text | Nom sans accents (généré) |
| ville_search | text | Ville sans accents (généré) |
| region_search | text | Région sans accents (généré) |
| refreshed_at | timestamptz | Dernière mise à jour Google |
| is_reviewed | bool | Marqué comme légitimé dans admin |

### Fonctions RPC
- `residences_near_city(city_query, radius_km)` — retourne les IDs dans un rayon autour d'une ville connue
- `residences_near_point(lat, lng, radius_km)` — retourne les IDs dans un rayon autour de coordonnées GPS

### Quality Score
```
quality_score = photo (+40) + ROUND(note_google × 4) + LEAST(FLOOR(nb_avis_google / 10), 20)
```
Max = 80. Sert à ordonner les résultats de recherche.

---

## Pipeline de données (`data-pipeline/`)

### Scripts dans l'ordre d'exécution

| Script | Commande npm | Description |
|---|---|---|
| `01-scrape-k10.js` | `scrape` | Scrape le registre K10 du MSSS par région |
| `02-clean.js` | `clean` | Normalise et déduplique les données |
| `03-geocode.js` | `geocode` | Géocode les adresses via Google Maps |
| `04-enrich-google.js` | `enrich` | Enrichit avec données Google Places (photo, note, avis) |
| `05-import-supabase.js` | `import` | Importe dans Supabase |
| `06-refresh-ratings.js` | `refresh` | Rafraîchit les données Google (batch, oldest-first) |
| `08-flag-suspicious.js` | — | Détecte les domaines suspects (CLI, --csv) |
| `09-cleanup-incomplete.js` | `cleanup` | Supprime les fiches sans aucune donnée utile |
| `10-scrape-services.js` | — | Scrape les 6 flags de services MSSS K10 |

### GitHub Actions
- Fichier: `.github/workflows/refresh-data.yml`
- Fréquence: chaque lundi à 6h UTC
- Action: exécute `06-refresh-ratings.js` (batch 60 résidences)
- Secrets requis: `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

### Source de données
- **Registre K10 MSSS** — liste officielle des RPAs au Québec, 23 codes de région
- **Google Places API** — enrichissement photo/note/avis
- **Google Maps Geocoding API** — coordonnées GPS

---

## Frontend (`frontend/`)

### Stack
- Next.js 16 App Router
- Tailwind CSS v4 (avec `@theme inline`)
- `@supabase/supabase-js`
- `next-intl` (FR/EN)
- `next/font` — Playfair Display + DM Sans

### Design System
```css
--color-creme:           #FAF7F2  /* fond principal */
--color-terracotta:      #C4593A  /* CTA, boutons primaires */
--color-terracotta-dark: #A84830
--color-marine:          #1C2B4A  /* nav admin, accents forts */
--color-marine-light:    #2A3F6B
--color-or:              #E8C97A  /* accents dorés */
--color-gris:            #F0EDE8
--color-texte:           #2D2D2D
```

### Pages publiques

| Route | Description |
|---|---|
| `/` | Page d'accueil — 9 vedettes, 5 stats, hero avec recherche |
| `/recherche` | Recherche par ville/région/services, pagination 20/page |
| `/carte` | Redirige vers `/recherche` |
| `/residence/[id]` | Fiche détaillée d'une résidence |
| `/residences/[ville]` | Toutes les résidences d'une ville |
| `/residences/region/[region]` | Toutes les résidences d'une région |
| `/comparer` | Comparateur côte-à-côte (max 3 résidences) |
| `/blog` | Articles statiques (MDX) |

### i18n
- FR à la racine (pas de préfixe)
- EN sous `/en/`
- `localePrefix: "as-needed"` dans next-intl
- Middleware exclut `/admin` du routage i18n

### Recherche (`/recherche`)
1. Recherche textuelle → colonnes `nom_search`, `ville_search`, `region_search` (sans accents)
2. Si ville reconnue → RPC `residences_near_city` (rayon 30 km) → tri : ville exacte d'abord, puis `quality_score` desc
3. Si ville inconnue → geocoding Google Maps → RPC `residences_near_point`
4. Filtres : région, catégorie, note minimale, 5 services (repas, soins, assistance, loisirs, sécurité)

### Variables d'environnement (frontend)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_MAPS_KEY
SUPABASE_SERVICE_KEY       (admin uniquement)
ADMIN_SECRET               (admin uniquement)
```

---

## Section Admin (`/admin`)

### Authentification
- Cookie HTTP-only, expire en 7 jours
- Hash SHA-256 de `ADMIN_SECRET` + sel fixe
- Toutes les actions serveur vérifient l'auth avant mutation

### Pages admin

| Route | Description |
|---|---|
| `/admin/login` | Formulaire mot de passe |
| `/admin` | Dashboard — 6 stats + répartition par région |
| `/admin/residences` | Liste avec filtres, recherche, pagination 50/page |
| `/admin/residence/[id]` | Formulaire d'édition + zone de danger |
| `/admin/cleanup` | Nettoyage — 4 sections |

### Sections du nettoyage
1. **Incomplètes** — pas de téléphone ET (pas de site ou pas de Google) — suppression en masse
2. **Téléphone seulement** — ont un numéro mais zéro autre donnée utile — suppression en masse
3. **Numéros en double** — même numéro partagé par plusieurs fiches — suppression individuelle
4. **Domaines suspects** — URL ou nom contient keywords immobiliers — bouton Légitimer ou Supprimer

### Détection suspecte
Vérifie le hostname du site web ET le nom de la résidence contre deux listes de mots-clés :
- URL : habitations, condo, immobilier, locatif, triplex, hotel, airbnb, invest, vente…
- Nom : condo, appartement, loft, hotel, chalet, gite, logement…

Le bouton **Légitimer** met `is_reviewed = true` — la fiche disparaît de la liste sans être supprimée.

---

## Gotchas techniques importants

1. **Supabase limite à 1000 lignes par défaut** — utiliser `{ count: "exact", head: true }` pour les counts, jamais `select("col")` pour compter
2. **Photo URL** — contient une vieille API key embarquée, remplacer à l'affichage avec `url.replace(/key=[^&]+/, key=NEW_KEY)`
3. **Layout admin** — a ses propres `<html>/<body>`, charger les fonts séparément
4. **Composants serveur** — pas de `onMouseOver`/`onMouseOut`, utiliser `<style>` avec `:hover`
5. **OR clauses Supabase** — 50+ conditions dépassent la limite URL — diviser en plusieurs requêtes
6. **is_reviewed** — filtrer en JS après réception, pas en DB WHERE (cache PostgREST)
7. **Middleware** — le matcher next-intl doit exclure `admin` sinon les pages admin retournent 404

---

## Commandes utiles

```bash
# Pipeline complet
cd data-pipeline && npm run pipeline

# Refresh Google uniquement
cd data-pipeline && npm run refresh

# Développement frontend
cd frontend && npm run dev

# Build production local
cd frontend && npm run build
```
