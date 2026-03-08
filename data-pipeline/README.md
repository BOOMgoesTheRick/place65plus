# momanetpopa.ca — Data Pipeline

Pipeline Node.js pour importer ~1,400 RPAs du Québec dans Supabase.

## Prérequis

- Node.js 18+
- Compte Supabase (gratuit)
- Clé Google API (optionnel, pour les photos/notes)

## Setup

```bash
npm install
cp .env.example .env
# Remplis .env avec tes clés
```

## Étapes

### 1. Créer la table Supabase

1. Aller dans **Supabase Dashboard → SQL Editor**
2. Copier-coller le contenu de `sql/create-table.sql`
3. Exécuter

### 2. Option A — Scraper le registre K10 (recommandé)

```bash
npm run scrape
```

Scrappe le registre public MSSS région par région.
Résultat : `data/rpa_raw.csv`

### 2. Option B — CSV gouvernemental

Si tu as téléchargé un CSV depuis donneesquebec.ca :
1. Renomme-le en `rpa_msss.csv`
2. Dépose-le dans `data/`
3. Passe directement au nettoyage

### 3. Nettoyer et dédupliquer

```bash
npm run clean
```

Résultat : `data/rpa_propre.csv`

### 4. Géocoder (latitude/longitude)

```bash
npm run geocode
```

Utilise Nominatim (gratuit) ou Google Geocoding API si `GOOGLE_API_KEY` est définie.
Durée : ~30 min pour 1 400 adresses avec Nominatim.
Résultat : `data/rpa_geocodee.csv`

### 5. Enrichir avec Google Places (optionnel)

```bash
npm run enrich
```

Nécessite `GOOGLE_API_KEY` avec Places API activée.
Ajoute : photos, note Google, site web, nombre d'avis.
Résultat : `data/rpa_enrichie.csv`

### 6. Importer dans Supabase

```bash
npm run import
```

Pour réimporter depuis zéro :
```bash
npm run import -- --reset
```

## Pipeline complet (sans enrichissement Google)

```bash
npm run scrape && npm run clean && npm run geocode && npm run import
```

## Structure des fichiers

```
data-pipeline/
├── scripts/
│   ├── 01-scrape-k10.js      # Scraper le registre MSSS
│   ├── 02-clean.js           # Nettoyage et déduplication
│   ├── 03-geocode.js         # Géocodage des adresses
│   ├── 04-enrich-google.js   # Enrichissement Google Places
│   └── 05-import-supabase.js # Import dans Supabase
├── sql/
│   └── create-table.sql      # Schéma de la table
├── data/                     # Fichiers CSV (ignorés par git)
│   ├── rpa_raw.csv
│   ├── rpa_propre.csv
│   ├── rpa_geocodee.csv
│   └── rpa_enrichie.csv
├── .env.example
└── README.md
```

## Note sur les données

Le registre MSSS recense les RPAs par catégorie — une résidence avec 2 catégories
apparaît 2 fois dans les données brutes. Le script 02-clean.js déduplique automatiquement
par numéro de téléphone et adresse.

Nombre actuel de RPAs certifiées au Québec : **~1,393** (mars 2024).
