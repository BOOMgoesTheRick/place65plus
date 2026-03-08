/**
 * Script 08 — Détecter les fiches suspectes (non-RPA)
 *
 * Cherche dans Supabase les résidences dont le site_web contient des
 * mots-clés suggérant qu'il ne s'agit pas d'une RPA (condos, immobilier…)
 *
 * Usage :
 *   node scripts/08-flag-suspicious.js           → affiche la liste
 *   node scripts/08-flag-suspicious.js --delete  → supprime après confirmation (pas dispo en CLI, utilise admin)
 *   node scripts/08-flag-suspicious.js --csv     → sauvegarde dans data/suspicious.csv
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SUSPICIOUS_KEYWORDS = [
  'habitations', 'condo', 'condos', 'appartement', 'appartements',
  'immobilier', 'locatif', 'logement', 'logements', 'lofts',
  'realty', 'investissement', 'real-estate', 'realestate',
  'rental', 'properties', 'location',
];

// Also flag suspicious by name (no website needed)
const SUSPICIOUS_NAME_KEYWORDS = [
  'condos', 'lofts', 'appartements', 'habitations',
];

function isSuspiciousByUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SUSPICIOUS_KEYWORDS.find(k => host.includes(k)) || null;
  } catch {
    return null;
  }
}

function isSuspiciousByName(nom) {
  if (!nom) return false;
  const lower = nom.toLowerCase();
  return SUSPICIOUS_NAME_KEYWORDS.find(k => lower.includes(k)) || null;
}

async function main() {
  const saveCSV = process.argv.includes('--csv');
  console.log('🔍 Recherche de fiches suspectes...\n');

  // Fetch all residences with site_web (paginate if needed)
  const results = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('residences')
      .select('id, nom, ville, region, site_web')
      .range(from, from + batchSize - 1);

    if (error) { console.error('❌', error.message); break; }
    if (!data || data.length === 0) break;

    for (const r of data) {
      const urlFlag = isSuspiciousByUrl(r.site_web);
      const nameFlag = isSuspiciousByName(r.nom);
      if (urlFlag || nameFlag) {
        results.push({
          id: r.id,
          nom: r.nom,
          ville: r.ville,
          region: r.region,
          site_web: r.site_web || '',
          raison: urlFlag ? `URL: ${urlFlag}` : `Nom: ${nameFlag}`,
        });
      }
    }

    from += batchSize;
    if (data.length < batchSize) break;
  }

  console.log(`⚠️  ${results.length} fiches suspectes trouvées\n`);

  if (results.length === 0) {
    console.log('✅ Aucune fiche suspecte détectée.');
    return;
  }

  // Group by region for readability
  const byRegion = {};
  for (const r of results) {
    const reg = r.region || 'Inconnue';
    if (!byRegion[reg]) byRegion[reg] = [];
    byRegion[reg].push(r);
  }

  for (const [region, items] of Object.entries(byRegion).sort()) {
    console.log(`\n📍 ${region} (${items.length})`);
    for (const r of items) {
      console.log(`   #${r.id} ${r.nom} — ${r.ville}`);
      if (r.site_web) console.log(`        🔗 ${r.site_web}`);
      console.log(`        ⚠️  ${r.raison}`);
      console.log(`        🗑  https://www.place65plus.quebec/residence/${r.id}`);
    }
  }

  if (saveCSV) {
    const lines = ['id,nom,ville,region,site_web,raison'];
    for (const r of results) {
      const esc = v => `"${String(v).replace(/"/g, '""')}"`;
      lines.push([r.id, esc(r.nom), esc(r.ville), esc(r.region), esc(r.site_web), esc(r.raison)].join(','));
    }
    const outPath = path.join(__dirname, '..', 'data', 'suspicious.csv');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, '\uFEFF' + lines.join('\n'), 'utf8');
    console.log(`\n💾 Sauvegardé : ${outPath}`);
  }

  console.log('\n💡 Pour supprimer : aller sur https://www.place65plus.quebec/admin');
  console.log('   Ou utiliser la vue "Suspects seulement" dans l\'admin → Liste des fiches');
}

main().catch(console.error);
