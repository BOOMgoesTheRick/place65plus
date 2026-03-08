/**
 * Script 03 — Géocoder les adresses (latitude / longitude)
 * Entrée  : data/rpa_propre.csv
 * Résultat: data/rpa_geocodee.csv
 *
 * Utilise Nominatim (OpenStreetMap) — gratuit, limite 1 req/sec.
 * Pour plus de précision : mettre GOOGLE_API_KEY dans .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeNominatim(adresse) {
  try {
    const url = `https://nominatim.openstreetmap.org/search`;
    const response = await axios.get(url, {
      params: {
        q: adresse,
        format: 'json',
        limit: 1,
        countrycodes: 'ca',
      },
      headers: { 'User-Agent': 'momanetpopa.ca geocoder/1.0' },
      timeout: 10000,
    });

    if (response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        source: 'nominatim',
      };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function geocodeGoogle(adresse) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: adresse, key: GOOGLE_API_KEY, region: 'ca', language: 'fr' },
      timeout: 10000,
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const loc = response.data.results[0].geometry.location;
      return { lat: loc.lat, lon: loc.lng, source: 'google' };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function geocode(adresse) {
  if (GOOGLE_API_KEY) {
    const result = await geocodeGoogle(adresse);
    if (result) return result;
  }
  return geocodeNominatim(adresse);
}

async function main() {
  const inputPath = path.join(DATA_DIR, 'rpa_propre.csv');
  if (!fs.existsSync(inputPath)) {
    console.error('❌ rpa_propre.csv introuvable — lance d\'abord npm run clean');
    process.exit(1);
  }

  const source = process.env.GOOGLE_API_KEY ? 'Google Geocoding API' : 'Nominatim (OpenStreetMap)';
  console.log(`🗺️  Géocodage des adresses via ${source}...\n`);

  const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  // Reprendre là où on s'est arrêté (si latitude déjà remplie)
  const todo = records.filter(r => !r.latitude || r.latitude === '');
  const done = records.filter(r => r.latitude && r.latitude !== '');
  console.log(`   ${done.length} déjà géocodés, ${todo.length} à traiter\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    const idx = records.indexOf(r);
    const adresse = r.adresse_complete || `${r.adresse}, ${r.ville}, QC, Canada`;

    process.stdout.write(`[${i + 1}/${todo.length}] ${r.nom} (${r.ville})... `);

    const result = await geocode(adresse);

    if (result) {
      records[idx].latitude = result.lat;
      records[idx].longitude = result.lon;
      process.stdout.write(`✅ ${result.lat.toFixed(4)}, ${result.lon.toFixed(4)} (${result.source})\n`);
      success++;
    } else {
      process.stdout.write(`❌ non trouvé\n`);
      failed++;
    }

    // Sauvegarder progressivement toutes les 50 entrées
    if ((i + 1) % 50 === 0) {
      const csv = stringify(records, { header: true });
      fs.writeFileSync(path.join(DATA_DIR, 'rpa_geocodee.csv'), '\uFEFF' + csv, 'utf8');
      console.log(`   💾 Sauvegarde intermédiaire (${i + 1}/${todo.length})`);
    }

    // Rate limit: 1.1s pour Nominatim, 0.1s pour Google
    await sleep(GOOGLE_API_KEY ? 100 : 1100);
  }

  // Sauvegarde finale
  const outputPath = path.join(DATA_DIR, 'rpa_geocodee.csv');
  const csv = stringify(records, { header: true });
  fs.writeFileSync(outputPath, '\uFEFF' + csv, 'utf8');

  console.log(`\n✅ Géocodage terminé`);
  console.log(`   Succès : ${success + done.length}/${records.length} (${Math.round((success + done.length) / records.length * 100)}%)`);
  console.log(`   Échecs : ${failed}`);
  console.log(`   Fichier : ${outputPath}`);
}

main();
