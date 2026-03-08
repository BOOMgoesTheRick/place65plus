/**
 * Script 06 — Rafraîchir les notes Google directement dans Supabase
 * Ne refait pas le scraping ni le géocodage.
 * Met à jour note_google, nb_avis_google, photo_url, telephone, site_web
 * pour les résidences les plus anciennes (par refreshed_at).
 *
 * Usage : node scripts/06-refresh-ratings.js [--batch 50]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const BATCH_SIZE     = parseInt(process.argv[process.argv.indexOf('--batch') + 1] || '60', 10);

if (!GOOGLE_API_KEY) { console.error('❌ GOOGLE_API_KEY manquante'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_KEY manquants'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findPlaceId(nom, ville) {
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: { input: `${nom} résidence aînés ${ville} Québec`, inputtype: 'textquery',
                fields: 'place_id,name,types', key: GOOGLE_API_KEY, language: 'fr' },
      timeout: 10000,
    });
    if (res.data.status === 'OK' && res.data.candidates.length > 0) {
      const c = res.data.candidates[0];
      const NON_RPA = ['restaurant','food','bar','cafe','store','gas_station','school','hospital','hotel'];
      if ((c.types || []).some(t => NON_RPA.includes(t))) return null;
      return c.place_id;
    }
  } catch { /* ignore */ }
  return null;
}

async function getDetails(placeId) {
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: { place_id: placeId,
                fields: 'rating,user_ratings_total,photos,website,international_phone_number,types,name',
                key: GOOGLE_API_KEY, language: 'fr' },
      timeout: 10000,
    });
    if (res.data.status === 'OK') return res.data.result;
  } catch { /* ignore */ }
  return null;
}

function photoUrl(ref) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  console.log(`🔄 Rafraîchissement des notes Google (batch: ${BATCH_SIZE})\n`);

  // Récupérer les résidences les plus anciennes (ou jamais rafraîchies)
  const { data: residences, error } = await supabase
    .from('residences')
    .select('id, nom, ville, telephone')
    .order('refreshed_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) { console.error('❌ Supabase:', error.message); process.exit(1); }
  console.log(`   ${residences.length} résidences à rafraîchir\n`);

  let updated = 0, skipped = 0;

  for (let i = 0; i < residences.length; i++) {
    const r = residences[i];
    process.stdout.write(`[${i + 1}/${residences.length}] ${r.nom}... `);

    const placeId = await findPlaceId(r.nom, r.ville);
    if (!placeId) {
      process.stdout.write(`❌ non trouvé\n`);
      // Marquer quand même comme rafraîchi pour ne pas retraiter indéfiniment
      await supabase.from('residences').update({ refreshed_at: new Date().toISOString() }).eq('id', r.id);
      skipped++;
      await sleep(150);
      continue;
    }

    const details = await getDetails(placeId);
    if (!details) {
      process.stdout.write(`⚠️  détails vides\n`);
      skipped++;
      await sleep(150);
      continue;
    }

    const patch = {
      refreshed_at: new Date().toISOString(),
      note_google:    details.rating               || null,
      nb_avis_google: details.user_ratings_total   || null,
      site_web:       details.website              || null,
    };
    if (details.photos?.length > 0) patch.photo_url = photoUrl(details.photos[0].photo_reference);
    if (details.international_phone_number && !r.telephone) patch.telephone = details.international_phone_number;

    const { error: updateError } = await supabase.from('residences').update(patch).eq('id', r.id);
    if (updateError) {
      process.stdout.write(`❌ update: ${updateError.message}\n`);
    } else {
      process.stdout.write(`✅ ${details.rating || 'N/A'} (${details.user_ratings_total || 0} avis)\n`);
      updated++;
    }

    await sleep(200);
  }

  console.log(`\n✅ Terminé — mis à jour: ${updated}, ignorés: ${skipped}`);
}

main();
