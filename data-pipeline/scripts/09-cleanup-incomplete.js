/**
 * Script 09 — Supprimer les fiches incomplètes
 *
 * Critères de suppression :
 *   1. Pas de téléphone (telephone IS NULL ou vide)
 *   2. Pas de site web ET pas de fiche Google (site_web IS NULL ET note_google IS NULL)
 *
 * Usage :
 *   node scripts/09-cleanup-incomplete.js            → dry-run (affiche seulement)
 *   node scripts/09-cleanup-incomplete.js --delete   → supprime pour vrai
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = !process.argv.includes('--delete');

async function fetchAll(query) {
  const results = [];
  let from = 0;
  const batch = 1000;
  while (true) {
    const { data, error } = await query.range(from, from + batch - 1);
    if (error) { console.error('❌', error.message); break; }
    if (!data || data.length === 0) break;
    results.push(...data);
    from += batch;
    if (data.length < batch) break;
  }
  return results;
}

async function main() {
  console.log(DRY_RUN
    ? '🔍 DRY-RUN — aucune suppression (ajouter --delete pour supprimer)\n'
    : '🗑  SUPPRESSION RÉELLE\n'
  );

  // Critère 1 : pas de téléphone
  const noPhone = await fetchAll(
    supabase.from('residences').select('id, nom, ville, region, site_web, note_google')
      .or('telephone.is.null,telephone.eq.')
  );

  // Critère 2 : pas de site web ET pas de Google (note_google null)
  const noWebNoGoogle = await fetchAll(
    supabase.from('residences').select('id, nom, ville, region')
      .is('site_web', null)
      .is('note_google', null)
  );

  // Merge and deduplicate by id
  const byId = new Map();
  for (const r of noPhone)       byId.set(r.id, { ...r, raison: 'Pas de téléphone' });
  for (const r of noWebNoGoogle) {
    if (!byId.has(r.id)) byId.set(r.id, { ...r, raison: 'Pas de site web ni fiche Google' });
    else byId.get(r.id).raison += ' + pas de site web ni fiche Google';
  }

  const toDelete = [...byId.values()];

  console.log(`📊 Résumé :`);
  console.log(`   Pas de téléphone                    : ${noPhone.length}`);
  console.log(`   Pas de site web ET pas de Google    : ${noWebNoGoogle.length}`);
  console.log(`   Total unique à supprimer            : ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('✅ Aucune fiche à supprimer.');
    return;
  }

  // Show by region
  const byRegion = {};
  for (const r of toDelete) {
    const reg = r.region || 'Inconnue';
    if (!byRegion[reg]) byRegion[reg] = [];
    byRegion[reg].push(r);
  }
  for (const [region, items] of Object.entries(byRegion).sort()) {
    console.log(`📍 ${region} (${items.length})`);
    for (const r of items.slice(0, 5)) {
      console.log(`   #${r.id} ${r.nom} — ${r.ville} [${r.raison}]`);
    }
    if (items.length > 5) console.log(`   ... et ${items.length - 5} autres`);
  }

  if (DRY_RUN) {
    console.log(`\n⚠️  Pour supprimer ces ${toDelete.length} fiches :`);
    console.log(`   node scripts/09-cleanup-incomplete.js --delete`);
    return;
  }

  // Delete in batches of 100
  console.log(`\n🗑  Suppression de ${toDelete.length} fiches...`);
  const ids = toDelete.map(r => r.id);
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const { error } = await supabase.from('residences').delete().in('id', batch);
    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/BATCH)+1}: ${error.message}`);
    } else {
      deleted += batch.length;
      process.stdout.write(`  ✅ ${deleted}/${ids.length}\r`);
    }
  }
  console.log(`\n\n🎉 ${deleted} fiches supprimées.`);
}

main().catch(console.error);
