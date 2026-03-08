/**
 * Script 05 — Importer les données dans Supabase
 * Entrée  : data/rpa_enrichie.csv (ou rpa_geocodee.csv, rpa_propre.csv)
 * Résultat: Table `residences` dans Supabase
 *
 * Nécessite SUPABASE_URL et SUPABASE_KEY dans .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BATCH_SIZE = 100;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables manquantes dans .env :');
  if (!SUPABASE_URL) console.error('   SUPABASE_URL=https://xxxx.supabase.co');
  if (!SUPABASE_KEY) console.error('   SUPABASE_SERVICE_KEY=ta_cle_service_role_ici');
  console.error('\nTrouve ces valeurs dans : Supabase Dashboard → Settings → API');
  process.exit(1);
}

function findInputFile() {
  const candidates = ['rpa_enrichie.csv', 'rpa_geocodee.csv', 'rpa_propre.csv'];
  for (const name of candidates) {
    const p = path.join(DATA_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseNum(val) {
  if (!val || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseBool(val) {
  return val === 'true' || val === '1' || val === 'TRUE';
}

function mapRecord(r) {
  return {
    nom: r.nom || null,
    adresse: r.adresse || null,
    ville: r.ville || null,
    region: r.region || null,
    mrc: r.mrc || null,
    code_postal: r.code_postal || null,
    telephone: r.telephone || null,
    site_web: r.site_web || null,
    categorie: r.categorie || null,
    nb_unites: parseNum(r.nb_unites),
    statut: r.statut || 'certifiee',
    latitude: parseNum(r.latitude),
    longitude: parseNum(r.longitude),
    note_google: parseNum(r.note_google),
    nb_avis_google: parseNum(r.nb_avis_google),
    photo_url: r.photo_url || null,
    prix_min: parseNum(r.prix_min),
    prix_max: parseNum(r.prix_max),
    description: r.description || null,
    langue_service: r.langue_service || 'francais',
    fiche_reclamee: parseBool(r.fiche_reclamee),
    tier: r.tier || 'gratuit',
  };
}

async function createTableIfNeeded(supabase) {
  // On essaie de lire la table — si elle n'existe pas, on affiche le SQL à exécuter
  const { error } = await supabase.from('residences').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.error('\n❌ La table `residences` n\'existe pas dans Supabase.');
    console.error('   Exécute ce SQL dans Supabase SQL Editor :\n');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'create-table.sql'), 'utf8');
    console.error(sql);
    process.exit(1);
  }
}

async function main() {
  const inputPath = findInputFile();
  if (!inputPath) {
    console.error('❌ Aucun CSV trouvé dans data/ — lance d\'abord npm run clean');
    process.exit(1);
  }

  console.log(`🗄️  Import dans Supabase...`);
  console.log(`   Source : ${path.basename(inputPath)}`);
  console.log(`   URL    : ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Vérifier la connexion et l'existence de la table
  await createTableIfNeeded(supabase);

  const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const records = parse(raw, { columns: true, skip_empty_lines: true });
  console.log(`   ${records.length} résidences à importer`);

  // Option : vider la table avant d'importer (pour reimport complet)
  if (process.argv.includes('--reset')) {
    console.log('\n⚠️  Option --reset : suppression des données existantes...');
    const { error } = await supabase.from('residences').delete().neq('id', 0);
    if (error) {
      console.error('   Erreur lors de la suppression:', error.message);
    } else {
      console.log('   ✅ Table vidée');
    }
  }

  // Importer par batch
  const mapped = records.map(mapRecord);
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('residences')
      .insert(batch);

    if (error) {
      console.error(`   ❌ Batch ${i / BATCH_SIZE + 1} : ${error.message}`);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`   ✅ Importé ${Math.min(i + BATCH_SIZE, mapped.length)}/${mapped.length}`);
    }
  }

  console.log(`\n🎉 Import terminé !`);
  console.log(`   Succès : ${imported}`);
  console.log(`   Erreurs: ${errors}`);
  console.log(`\n   Vérifie dans Supabase → Table Editor → residences`);
}

main();
