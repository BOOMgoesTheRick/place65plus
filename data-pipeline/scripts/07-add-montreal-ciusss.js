/**
 * Script 07 — Ajouter les résidences des sous-régions CIUSSS de Montréal (61-65)
 * Ces régions n'étaient pas incluses dans le scrape initial.
 *
 * Étapes :
 *   1. Scrape MSSS codes 61-65
 *   2. Filtre les résidences déjà dans Supabase (par nom+ville)
 *   3. Géocode via Google
 *   4. Enrichit via Google Places
 *   5. Insère dans Supabase
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CIUSSS_CODES = ['61', '62', '63', '64', '65'];
const BASE_URL = 'http://k10.pub.msss.rtss.qc.ca/public/K10FormRecherche.asp';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function nomVilleKey(nom, ville) {
  return `${(nom||'').toLowerCase().replace(/\s+/g,' ').trim()}|${(ville||'').toLowerCase().replace(/\s+/g,' ').trim()}`;
}

function titleCase(str) {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').split(' ')
    .map(w => w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Step 1: Scrape MSSS for a given region code
async function scrapeRegion(code) {
  const res = [];
  try {
    const r = await axios.get(BASE_URL, {
      params: { hidPasseParFormulaireRecherche:'1', act:'Rechercher', cdRSS: code, nmResid:'', nomMunicipalite:'', cdCLSC:'', cdRLS:'', cdMRC:'', refTpResid:'', refStForm:'', noResReg:'', boolLogeRepas:'', boolSoin:'', boolAssistance:'', boolAlimentation:'', boolLoisir:'', boolSecurite:'', nmProprio:'', pnmProprio:'', refStRes:'' },
      responseType: 'arraybuffer', timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://k10.pub.msss.rtss.qc.ca/public/k10FormRecherche.asp' }
    });
    const html = r.data.toString('latin1');
    const $ = cheerio.load(html, { decodeEntities: false });
    $('a[href*="K10ConsFormAbg.asp"]').each((i, a) => {
      const href = $(a).attr('href') || '';
      const nom = $(a).text().trim();
      if (!nom || /^\d[\d\-]*$/.test(nom)) return;
      const cells = $(a).closest('tr').find('td');
      const ville = cells.last().text().trim();
      res.push({ nom: titleCase(nom), ville: titleCase(ville || 'Montréal'), region: 'Montréal' });
    });
  } catch (e) {
    console.error(`  ❌ Erreur région ${code}: ${e.message}`);
  }
  return res;
}

// Step 2: Geocode via Google
async function geocode(nom, ville) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: `${nom}, ${ville}, Québec, Canada`, key: GOOGLE_API_KEY, language: 'fr' },
      timeout: 10000,
    });
    if (r.data.status === 'OK') {
      const loc = r.data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {}
  return null;
}

// Step 3: Enrich via Google Places
const NON_RPA = new Set(['restaurant','food','bar','cafe','bakery','store','shop','gas_station','hospital','school','university','gym','pharmacy','bank','hotel','motel']);

async function findPlaceId(nom, ville) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: { input: `${nom} résidence aînés ${ville} Québec`, inputtype: 'textquery', fields: 'place_id,name,types', key: GOOGLE_API_KEY, language: 'fr' },
      timeout: 10000,
    });
    if (r.data.status === 'OK' && r.data.candidates.length > 0) {
      const c = r.data.candidates[0];
      if ((c.types||[]).some(t => NON_RPA.has(t))) return null;
      return c.place_id;
    }
  } catch {}
  return null;
}

async function getPlaceDetails(placeId) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: { place_id: placeId, fields: 'website,rating,user_ratings_total,photos,international_phone_number,types', key: GOOGLE_API_KEY, language: 'fr' },
      timeout: 10000,
    });
    if (r.data.status === 'OK') return r.data.result;
  } catch {}
  return null;
}

function photoUrl(ref) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  console.log('🏙️  Ajout des résidences CIUSSS Montréal (61-65)\n');

  // Scrape all 5 codes
  const scraped = [];
  for (const code of CIUSSS_CODES) {
    process.stdout.write(`  Scraping code ${code}... `);
    const res = await scrapeRegion(code);
    console.log(`${res.length} résidences`);
    scraped.push(...res);
    await sleep(1200);
  }
  console.log(`\n  Total scrappé : ${scraped.length}`);

  // Deduplicate scraped list by nom+ville
  const seenScraped = new Set();
  const unique = scraped.filter(r => {
    const k = nomVilleKey(r.nom, r.ville);
    if (seenScraped.has(k)) return false;
    seenScraped.add(k);
    return true;
  });
  console.log(`  Après dédup scrape : ${unique.length}`);

  // Load existing DB entries for Montreal
  const { data: existing } = await supabase
    .from('residences')
    .select('nom, ville')
    .eq('region', 'Montréal');

  const existingKeys = new Set((existing || []).map(r => nomVilleKey(r.nom, r.ville)));
  console.log(`  Déjà dans DB (Montréal) : ${existingKeys.size}`);

  const toAdd = unique.filter(r => !existingKeys.has(nomVilleKey(r.nom, r.ville)));
  console.log(`  Nouvelles à ajouter : ${toAdd.length}\n`);

  if (toAdd.length === 0) {
    console.log('✅ Rien à ajouter — toutes déjà dans la DB.');
    return;
  }

  // Geocode + enrich each new residence
  const records = [];
  for (let i = 0; i < toAdd.length; i++) {
    const r = toAdd[i];
    process.stdout.write(`[${i+1}/${toAdd.length}] ${r.nom}... `);

    const record = {
      nom: r.nom,
      ville: r.ville,
      region: r.region,
      statut: 'Certifiée',
      langue_service: 'francais',
      tier: 'gratuit',
      fiche_reclamee: false,
    };

    // Geocode
    const coords = await geocode(r.nom, r.ville);
    if (coords) {
      record.latitude = coords.lat;
      record.longitude = coords.lng;
    }

    // Google Places
    const placeId = await findPlaceId(r.nom, r.ville);
    if (placeId) {
      const details = await getPlaceDetails(placeId);
      if (details && !(details.types||[]).some(t => NON_RPA.has(t))) {
        record.site_web = details.website || null;
        record.note_google = details.rating || null;
        record.nb_avis_google = details.user_ratings_total || null;
        record.telephone = details.international_phone_number || null;
        if (details.photos?.length > 0) record.photo_url = photoUrl(details.photos[0].photo_reference);
      }
    }

    console.log(`✅ coords:${coords?'oui':'non'} google:${placeId?'oui':'non'}`);
    records.push(record);
    await sleep(250);
  }

  // Insert into Supabase in batches
  console.log(`\n💾 Insertion dans Supabase...`);
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('residences').insert(batch);
    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/BATCH)+1}: ${error.message}`);
    } else {
      inserted += batch.length;
      console.log(`  ✅ ${Math.min(i+BATCH, records.length)}/${records.length}`);
    }
  }

  console.log(`\n🎉 Terminé — ${inserted} nouvelles résidences ajoutées.`);
}

main().catch(console.error);
