# Étape 1 — Importer les données des résidences
## momanetpopa.ca — Guide technique complet

---

## Vue d'ensemble

```
Registre MSSS  →  Nettoyage CSV  →  Enrichissement Google  →  Base de données  →  Site en ligne
  (1 800 RPA)      (Python)           (Places API)            (Supabase)          (Next.js)
```

**Durée estimée :** 1 à 2 semaines  
**Coût :** ~0 $ (sauf Google Places API au-delà du quota gratuit)  
**Résultat :** Site avec 1 800+ fiches complètes dès le lancement

---

## Étape 1.1 — Obtenir les données du registre MSSS

### Source officielle
Le registre public des RPA est géré par le MSSS et accessible en ligne :

- **Registre en ligne :** http://k10.pub.msss.rtss.qc.ca/public/k10FormRecherche.asp
- **Portail données ouvertes :** https://www.donneesquebec.ca (chercher "résidences privées aînés")
- **Atlas MSSS (carte) :** https://msss.gouv.qc.ca/professionnels/informations-geographiques-et-de-population/atlas-de-la-sante-et-des-services-sociaux/carte-localisation-des-residences-privees-pour-aines/

### Données disponibles dans le registre
| Champ | Disponible |
|---|---|
| Nom de la résidence | ✅ |
| Adresse complète | ✅ |
| Téléphone | ✅ |
| Région / MRC | ✅ |
| Catégorie (1 à 6) | ✅ |
| Nombre d'unités | ✅ |
| Statut de certification | ✅ |
| Site web | ❌ (à enrichir) |
| Photos | ❌ (à enrichir) |
| Prix | ❌ (à enrichir) |

### Comment télécharger
1. Aller sur **donneesquebec.ca**
2. Chercher : `résidences privées aînés`
3. Télécharger le fichier CSV disponible
4. **Si pas de CSV direct :** scraper le registre MSSS (voir Étape 1.2B)

> ⚠️ **Note importante :** Le registre recense les RPA par *catégorie*. Une même résidence exploitant deux catégories apparaît comme deux entrées distinctes. Il faut dédupliquer par adresse ou numéro de téléphone. Cela peut représenter un écart de ~300 entrées dans les données brutes.

---

## Étape 1.2 — Nettoyer les données (Python)

### A) Si tu as un CSV du gouvernement

Installe les dépendances :
```bash
pip install pandas geopy
```

Script de nettoyage :
```python
import pandas as pd

# Charger le CSV
df = pd.read_csv('rpa_msss.csv', encoding='utf-8-sig')

# Voir les colonnes disponibles
print(df.columns.tolist())

# Renommer les colonnes en snake_case propre
df = df.rename(columns={
    'Nom de la résidence': 'nom',
    'Adresse': 'adresse',
    'Municipalité': 'ville',
    'Code postal': 'code_postal',
    'Téléphone': 'telephone',
    'Région': 'region',
    'MRC': 'mrc',
    'Catégorie': 'categorie',
    "Nombre d'unités": 'nb_unites',
    'Statut': 'statut_certification',
})

# Garder seulement les résidences actives/certifiées
df = df[df['statut_certification'].str.contains('Certifié|Actif', na=False)]

# Dédupliquer par téléphone (même résidence, catégories différentes)
df = df.drop_duplicates(subset=['telephone'], keep='first')

# Nettoyer les numéros de téléphone
df['telephone'] = df['telephone'].str.replace(r'\D', '', regex=True)
df['telephone'] = df['telephone'].apply(lambda x: f"({x[:3]}) {x[3:6]}-{x[6:]}" if len(x) == 10 else x)

# Normaliser les codes postaux
df['code_postal'] = df['code_postal'].str.upper().str.strip()

# Créer l'adresse complète pour le géocodage
df['adresse_complete'] = df['adresse'] + ', ' + df['ville'] + ', QC, ' + df['code_postal']

# Ajouter des colonnes vides à enrichir plus tard
df['site_web'] = ''
df['photo_url'] = ''
df['note_google'] = ''
df['prix_min'] = ''
df['prix_max'] = ''
df['latitude'] = ''
df['longitude'] = ''
df['description'] = ''

# Sauvegarder
df.to_csv('rpa_propre.csv', index=False, encoding='utf-8-sig')
print(f"✅ {len(df)} résidences exportées")
```

### B) Si pas de CSV disponible — Scraper le registre MSSS

```bash
pip install requests beautifulsoup4 pandas
```

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

BASE_URL = "http://k10.pub.msss.rtss.qc.ca/public/"
residences = []

# Le registre permet la recherche par région (codes 01 à 17)
regions = [f"{i:02d}" for i in range(1, 18)]

for region in regions:
    print(f"Scraping région {region}...")
    
    payload = {'region': region, 'btnRechercher': 'Rechercher'}
    response = requests.post(BASE_URL + 'k10FormRecherche.asp', data=payload)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extraire les résultats du tableau
    table = soup.find('table', {'class': 'tableau'})
    if table:
        for row in table.find_all('tr')[1:]:  # Skip header
            cols = row.find_all('td')
            if len(cols) >= 5:
                residences.append({
                    'nom': cols[0].text.strip(),
                    'adresse': cols[1].text.strip(),
                    'ville': cols[2].text.strip(),
                    'telephone': cols[3].text.strip(),
                    'categorie': cols[4].text.strip(),
                    'region': region,
                })
    
    time.sleep(1)  # Respecter le serveur

df = pd.DataFrame(residences)
df.to_csv('rpa_scraped.csv', index=False, encoding='utf-8-sig')
print(f"✅ {len(df)} résidences trouvées")
```

---

## Étape 1.3 — Géocoder les adresses (latitude/longitude)

Nécessaire pour afficher les résidences sur la carte.

```bash
pip install geopy
```

```python
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

df = pd.read_csv('rpa_propre.csv')
geolocator = Nominatim(user_agent="momanetpopa_geocoder")

def geocode_adresse(adresse):
    try:
        location = geolocator.geocode(adresse, timeout=10)
        if location:
            return location.latitude, location.longitude
    except GeocoderTimedOut:
        time.sleep(2)
        return geocode_adresse(adresse)
    return None, None

# Géocoder (respecter le rate limit de Nominatim : 1 requête/seconde)
for i, row in df.iterrows():
    if not row['latitude']:
        lat, lon = geocode_adresse(row['adresse_complete'])
        df.at[i, 'latitude'] = lat
        df.at[i, 'longitude'] = lon
        print(f"[{i+1}/{len(df)}] {row['nom']} → {lat}, {lon}")
        time.sleep(1.1)

df.to_csv('rpa_geocodee.csv', index=False)
print("✅ Géocodage terminé")
```

> 💡 **Alternative gratuite :** Google Geocoding API est plus précise mais coûte ~0,005 $/requête. Pour 1 800 adresses = ~9 $. Une seule fois, ça vaut la peine.

---

## Étape 1.4 — Enrichir avec Google Places API

Cette étape ajoute automatiquement : photos, note, site web, heures d'ouverture.

### Setup
1. Créer un compte sur [console.cloud.google.com](https://console.cloud.google.com)
2. Activer **Places API**
3. Générer une clé API
4. Le quota gratuit = **$200/mois** (~6 000 requêtes Places gratuites)

```bash
pip install googlemaps
```

```python
import googlemaps
import pandas as pd
import time

gmaps = googlemaps.Client(key='TA_CLE_API_ICI')
df = pd.read_csv('rpa_geocodee.csv')

for i, row in df.iterrows():
    if row['site_web']:  # Déjà enrichi
        continue
    
    # Chercher la résidence dans Places
    query = f"{row['nom']} {row['ville']} Québec"
    results = gmaps.find_place(
        input=query,
        input_type='textquery',
        fields=['place_id', 'name', 'rating', 'formatted_address']
    )
    
    if results['candidates']:
        place_id = results['candidates'][0]['place_id']
        
        # Obtenir les détails complets
        details = gmaps.place(
            place_id=place_id,
            fields=['website', 'rating', 'user_ratings_total', 'photo', 'formatted_phone_number']
        )['result']
        
        df.at[i, 'site_web'] = details.get('website', '')
        df.at[i, 'note_google'] = details.get('rating', '')
        df.at[i, 'nb_avis_google'] = details.get('user_ratings_total', '')
        
        # URL de la première photo
        if 'photos' in details:
            photo_ref = details['photos'][0]['photo_reference']
            df.at[i, 'photo_url'] = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key=TA_CLE_API_ICI"
    
    print(f"[{i+1}/{len(df)}] ✅ {row['nom']}")
    time.sleep(0.1)

df.to_csv('rpa_enrichie.csv', index=False)
print("✅ Enrichissement terminé")
```

---

## Étape 1.5 — Importer dans Supabase (base de données)

### Setup Supabase
1. Créer un compte gratuit sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans **Table Editor** → **New Table**

### Structure de la table `residences`

```sql
CREATE TABLE residences (
  id              SERIAL PRIMARY KEY,
  nom             TEXT NOT NULL,
  adresse         TEXT,
  ville           TEXT,
  region          TEXT,
  mrc             TEXT,
  code_postal     TEXT,
  telephone       TEXT,
  site_web        TEXT,
  categorie       TEXT,
  nb_unites       INTEGER,
  statut          TEXT DEFAULT 'certifiee',
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  note_google     DECIMAL(2, 1),
  nb_avis_google  INTEGER,
  photo_url       TEXT,
  prix_min        INTEGER,
  prix_max        INTEGER,
  description     TEXT,
  langue_service  TEXT DEFAULT 'francais',
  fiche_reclamee  BOOLEAN DEFAULT FALSE,
  tier            TEXT DEFAULT 'gratuit', -- gratuit, standard, premium, vedette
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_residences_ville ON residences(ville);
CREATE INDEX idx_residences_region ON residences(region);
CREATE INDEX idx_residences_categorie ON residences(categorie);
CREATE INDEX idx_residences_geo ON residences(latitude, longitude);
```

### Importer le CSV dans Supabase

```python
import pandas as pd
from supabase import create_client

# Tes clés Supabase (dans ton dashboard → Settings → API)
SUPABASE_URL = "https://xxxx.supabase.co"
SUPABASE_KEY = "ta_cle_anon_ici"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
df = pd.read_csv('rpa_enrichie.csv')

# Convertir en liste de dicts et importer par batch
records = df.where(pd.notnull(df), None).to_dict('records')

batch_size = 100
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    supabase.table('residences').insert(batch).execute()
    print(f"✅ Importé {min(i+batch_size, len(records))}/{len(records)}")

print("🎉 Import terminé!")
```

---

## Étape 1.6 — Vérification finale

Après l'import, vérifier dans Supabase :

```sql
-- Nombre total de résidences
SELECT COUNT(*) FROM residences;

-- Répartition par région
SELECT region, COUNT(*) as total
FROM residences
GROUP BY region
ORDER BY total DESC;

-- Résidences avec photo
SELECT COUNT(*) FROM residences WHERE photo_url IS NOT NULL;

-- Résidences avec site web
SELECT COUNT(*) FROM residences WHERE site_web IS NOT NULL AND site_web != '';
```

**Résultats attendus :**
| Vérification | Cible |
|---|---|
| Total résidences | 1 400 – 1 800 |
| Avec coordonnées GPS | > 95% |
| Avec photo Google | > 70% |
| Avec site web | > 50% |
| Avec note Google | > 60% |

---

## Résumé des outils utilisés

| Outil | Usage | Coût |
|---|---|---|
| donneesquebec.ca | Source des données MSSS | Gratuit |
| Python + pandas | Nettoyage et traitement | Gratuit |
| Nominatim (OpenStreetMap) | Géocodage des adresses | Gratuit |
| Google Places API | Enrichissement (photos, notes) | ~0–20 $ |
| Supabase | Base de données PostgreSQL | Gratuit jusqu'à 500 MB |

**Coût total de l'étape 1 : 0 à 20 $** 🎉

---

## Prochaine étape → Construire le site (Next.js + Supabase)

Une fois les données importées, on peut brancher le frontend :
- Page d'accueil avec recherche
- Affichage des fiches sur carte
- Pages de résidence individuelles
- Filtres par région, catégorie, prix

---

*momanetpopa.ca — Étape 1 : Import des données — v1.0*
*"Parce que le sous-sol, c'est pu une option."*
