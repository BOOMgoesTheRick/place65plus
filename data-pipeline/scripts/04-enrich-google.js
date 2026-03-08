/**
 * Script 04 — Enrichir avec Google Places API
 * Ajoute : photos, note Google, site web, nombre d'avis
 * Entrée  : data/rpa_geocodee.csv
 * Résultat: data/rpa_enrichie.csv
 *
 * Nécessite GOOGLE_API_KEY dans .env avec Places API activée.
 * Quota gratuit : $200/mois (~4 000 requêtes Places Details)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY manquante dans .env');
  console.error('   Crée un fichier .env avec : GOOGLE_API_KEY=ta_cle_ici');
  console.error('   Ou saute cette étape et lance directement npm run import\n');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mots-clés dans les types Google Places qui confirment qu'il s'agit d'un lieu senior
const RPA_TYPES = new Set([
  'nursing_home', 'retirement_home', 'assisted_living_facility',
  'senior_center', 'lodging', 'establishment', 'health',
]);

// Mots-clés dans les types qui indiquent un faux positif évident
const NON_RPA_TYPES = new Set([
  'restaurant', 'food', 'bar', 'cafe', 'bakery', 'store', 'shop',
  'gas_station', 'hospital', 'school', 'university', 'gym',
  'pharmacy', 'bank', 'hotel', 'motel',
]);

// Valide que le nom du lieu Google ressemble à la résidence cherchée
function nameMatches(searchNom, googleName) {
  if (!googleName) return false;
  const a = searchNom.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç0-9]/g, '');
  const b = googleName.toLowerCase().replace(/[^a-zàâéèêëîïôùûüç0-9]/g, '');
  // Au moins 4 caractères consécutifs en commun
  const words = searchNom.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  return words.some(w => b.includes(w.replace(/[^a-zàâéèêëîïôùûüç0-9]/g, '')));
}

async function findPlaceId(nom, ville) {
  try {
    // Requête enrichie : ajouter "résidence aînés" pour réduire les faux positifs
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        input: `${nom} résidence aînés ${ville} Québec`,
        inputtype: 'textquery',
        fields: 'place_id,name,formatted_address,types',
        key: GOOGLE_API_KEY,
        language: 'fr',
      },
      timeout: 10000,
    });

    if (response.data.status === 'OK' && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];

      // Rejeter si le nom ne correspond pas du tout
      if (!nameMatches(nom, candidate.name)) {
        return null;
      }

      // Rejeter si les types Google indiquent clairement un non-RPA
      const types = candidate.types || [];
      if (types.some(t => NON_RPA_TYPES.has(t))) {
        return null;
      }

      return candidate.place_id;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function getPlaceDetails(placeId) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'website,rating,user_ratings_total,photos,international_phone_number,types,name',
        key: GOOGLE_API_KEY,
        language: 'fr',
      },
      timeout: 10000,
    });

    if (response.data.status === 'OK') {
      return response.data.result;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function buildPhotoUrl(photoReference) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  const inputPath = path.join(DATA_DIR, 'rpa_geocodee.csv');
  const fallbackPath = path.join(DATA_DIR, 'rpa_propre.csv');

  const sourcePath = fs.existsSync(inputPath) ? inputPath : fallbackPath;
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Aucun fichier CSV trouvé — lance d\'abord npm run clean');
    process.exit(1);
  }

  console.log(`🔍 Enrichissement Google Places API...\n`);
  console.log(`   Source : ${path.basename(sourcePath)}`);

  const raw = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  const todo = records.filter(r => {
    const hasPhone = r.telephone && r.telephone !== '';
    const hasGoogleData = r.note_google && r.note_google !== '';
    const hasSiteWeb = r.site_web && r.site_web !== '';
    // Traiter seulement : pas encore enrichi OU déjà trouvé sur Google mais sans téléphone
    return !hasSiteWeb || (hasGoogleData && !hasPhone);
  });
  console.log(`   ${records.length - todo.length} déjà complets, ${todo.length} à traiter\n`);

  let enriched = 0;
  let notFound = 0;

  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    const idx = records.indexOf(r);

    process.stdout.write(`[${i + 1}/${todo.length}] ${r.nom}... `);

    const placeId = await findPlaceId(r.nom, r.ville);

    if (placeId) {
      const details = await getPlaceDetails(placeId);

      if (details) {
        // Vérification finale : rejeter les non-RPA évidents détectés dans les détails
        const detailTypes = details.types || [];
        if (detailTypes.some(t => NON_RPA_TYPES.has(t))) {
          process.stdout.write(`🚫 faux positif (type: ${detailTypes[0]})\n`);
          notFound++;
          await sleep(200);
          continue;
        }

        records[idx].site_web = details.website || '';
        records[idx].note_google = details.rating || '';
        records[idx].nb_avis_google = details.user_ratings_total || '';

        if (details.international_phone_number && !records[idx].telephone) {
          records[idx].telephone = details.international_phone_number;
        }

        if (details.photos && details.photos.length > 0) {
          records[idx].photo_url = buildPhotoUrl(details.photos[0].photo_reference);
        }

        process.stdout.write(`✅ note: ${details.rating || 'N/A'}, avis: ${details.user_ratings_total || 0}, tél: ${details.international_phone_number || 'N/A'}\n`);
        enriched++;
      } else {
        process.stdout.write(`⚠️  place_id trouvé mais détails vides\n`);
        notFound++;
      }
    } else {
      process.stdout.write(`❌ non trouvé sur Google\n`);
      notFound++;
    }

    // Sauvegarde intermédiaire toutes les 25 entrées
    if ((i + 1) % 25 === 0) {
      const csv = stringify(records, { header: true });
      fs.writeFileSync(path.join(DATA_DIR, 'rpa_enrichie.csv'), '\uFEFF' + csv, 'utf8');
      console.log(`   💾 Sauvegarde intermédiaire (${i + 1}/${todo.length})`);
    }

    await sleep(200); // ~5 req/sec pour rester dans le quota
  }

  // Sauvegarde finale
  const outputPath = path.join(DATA_DIR, 'rpa_enrichie.csv');
  const csv = stringify(records, { header: true });
  fs.writeFileSync(outputPath, '\uFEFF' + csv, 'utf8');

  console.log(`\n✅ Enrichissement terminé`);
  console.log(`   Enrichis    : ${enriched}`);
  console.log(`   Non trouvés : ${notFound}`);
  console.log(`   Fichier : ${outputPath}`);
}

main();
