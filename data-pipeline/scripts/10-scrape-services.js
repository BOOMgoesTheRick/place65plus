/**
 * Script 10 — Scraper les services MSSS et mettre à jour Supabase
 *
 * Pour chaque service (repas, soins, assistance, alimentation, loisirs, sécurité),
 * interroge le registre K10 région par région, puis met à jour la DB.
 *
 * Prérequis : exécuter le SQL dans data-pipeline/sql/08-services.sql d'abord
 *
 * Usage : node scripts/10-scrape-services.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios   = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_URL = 'http://k10.pub.msss.rtss.qc.ca/public/K10FormRecherche.asp';

const REGION_CODES = [
  '01','02','03','04','05','06',
  '61','62','63','64','65',
  '07','08','09','10','11','12','13','14','15','16','17','18',
];

const SERVICES = [
  { col: 'service_repas',        param: 'boolLogeRepas',   label: 'Repas inclus' },
  { col: 'service_soins',        param: 'boolSoin',        label: 'Soins infirmiers' },
  { col: 'service_assistance',   param: 'boolAssistance',  label: 'Assistance personnelle' },
  { col: 'service_alimentation', param: 'boolAlimentation',label: 'Aide à l\'alimentation' },
  { col: 'service_loisirs',      param: 'boolLoisir',      label: 'Activités/loisirs' },
  { col: 'service_securite',     param: 'boolSecurite',    label: 'Sécurité/surveillance' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalizeStr(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function titleCase(str) {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').split(' ')
    .map(w => w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Scrape all residences with a given service flag for a region
async function scrapeServiceRegion(serviceParam, regionCode) {
  const params = {
    hidPasseParFormulaireRecherche: '1',
    act: 'Rechercher',
    cdRSS: regionCode,
    nmResid: '', nomMunicipalite: '', cdCLSC: '', cdRLS: '', cdMRC: '',
    refTpResid: '', refStForm: '', noResReg: '',
    boolLogeRepas: '', boolSoin: '', boolAssistance: '',
    boolAlimentation: '', boolLoisir: '', boolSecurite: '',
    nmProprio: '', pnmProprio: '', refStRes: '',
  };
  params[serviceParam] = '1';

  try {
    const r = await axios.get(BASE_URL, {
      params,
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': BASE_URL },
    });
    const html = r.data.toString('latin1');
    const $ = cheerio.load(html, { decodeEntities: false });

    const results = [];
    $('a[href*="K10ConsFormAbg.asp"]').each((i, a) => {
      const nom = $(a).text().trim();
      if (!nom || /^\d[\d\-]*$/.test(nom)) return;
      const cells = $(a).closest('tr').find('td');
      const ville = cells.last().text().trim();
      results.push({ nom: normalizeStr(titleCase(nom)), ville: normalizeStr(titleCase(ville || '')) });
    });
    return results;
  } catch (e) {
    console.error(`  ❌ ${serviceParam} région ${regionCode}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('🔧 Scraping des services MSSS...\n');
  console.log('⚠️  Assurez-vous d\'avoir exécuté sql/08-services.sql dans Supabase d\'abord.\n');

  for (const service of SERVICES) {
    console.log(`\n📋 ${service.label} (${service.col})`);

    // Collect all nom+ville with this service
    const withService = new Set(); // "nom|ville"
    let totalFound = 0;

    for (const code of REGION_CODES) {
      process.stdout.write(`  Région ${code}... `);
      const results = await scrapeServiceRegion(service.param, code);
      for (const r of results) withService.add(`${r.nom}|${r.ville}`);
      process.stdout.write(`${results.length}\n`);
      totalFound += results.length;
      await sleep(800);
    }

    console.log(`  Total scraped: ${totalFound} → ${withService.size} uniques`);

    if (withService.size === 0) continue;

    // Fetch all residences from DB (paginated) and match
    let matched = 0;
    let from = 0;
    const batchSize = 1000;
    const toUpdate = [];

    while (true) {
      const { data, error } = await supabase
        .from('residences')
        .select('id, nom, ville')
        .range(from, from + batchSize - 1);
      if (error || !data || data.length === 0) break;

      for (const r of data) {
        const key = `${normalizeStr(r.nom)}|${normalizeStr(r.ville)}`;
        if (withService.has(key)) toUpdate.push(r.id);
      }

      from += batchSize;
      if (data.length < batchSize) break;
    }

    console.log(`  Correspondances DB : ${toUpdate.length}`);

    // Update in batches of 200
    const UPDATE_BATCH = 200;
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH) {
      const batch = toUpdate.slice(i, i + UPDATE_BATCH);
      const { error } = await supabase
        .from('residences')
        .update({ [service.col]: true })
        .in('id', batch);
      if (error) console.error(`  ❌ Update batch: ${error.message}`);
      else matched += batch.length;
    }

    console.log(`  ✅ ${matched} résidences mises à jour`);
  }

  console.log('\n🎉 Terminé !');
  console.log('   Les colonnes service_* sont maintenant remplies dans Supabase.');
  console.log('   Prochaine étape : activer les filtres dans le frontend.');
}

main().catch(console.error);
