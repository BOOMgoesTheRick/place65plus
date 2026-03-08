/**
 * Script 01 — Scraper le registre K10 du MSSS
 * Résultat : data/rpa_raw.csv
 *
 * Données disponibles sans login : région, numéro registre, nom, ville
 * L'adresse/téléphone/photos seront enrichis par Google Places (script 04)
 *
 * URL : http://k10.pub.msss.rtss.qc.ca/public/K10FormRecherche.asp?act=Rechercher&cdRSS=XX
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

const BASE_URL = 'http://k10.pub.msss.rtss.qc.ca/public/K10FormRecherche.asp';
const DATA_DIR = path.join(__dirname, '..', 'data');

// Codes de régions sociosanitaires du Québec (01-18)
const REGIONS = {
  '01': 'Bas-Saint-Laurent',
  '02': 'Saguenay–Lac-Saint-Jean',
  '03': 'Capitale-Nationale',
  '04': 'Mauricie et Centre-du-Québec',
  '05': 'Estrie',
  '06': 'Montréal',
  '07': 'Outaouais',
  '08': 'Abitibi-Témiscamingue',
  '09': 'Côte-Nord',
  '10': 'Nord-du-Québec',
  '11': 'Gaspésie–Îles-de-la-Madeleine',
  '12': 'Chaudière-Appalaches',
  '13': 'Laval',
  '14': 'Lanaudière',
  '15': 'Laurentides',
  '16': 'Montérégie',
  '17': 'Nunavik',
  '18': 'Terres-Cries-de-la-Baie-James',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeRegion(regionCode, regionName) {
  const residences = [];

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        hidPasseParFormulaireRecherche: '1',
        cert: '',
        act: 'Rechercher',
        nmResid: '',
        nomMunicipalite: '',
        cdRSS: regionCode,
        cdCLSC: '',
        cdRLS: '',
        cdMRC: '',
        refTpResid: '',
        refStForm: '',
        noResReg: '',
        boolLogeRepas: '',
        boolSoin: '',
        boolAssistance: '',
        boolAlimentation: '',
        boolLoisir: '',
        boolSecurite: '',
        nmProprio: '',
        pnmProprio: '',
        refStRes: '',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://k10.pub.msss.rtss.qc.ca/public/k10FormRecherche.asp',
      },
    });

    // Décoder latin-1 (ISO-8859-1)
    const html = response.data.toString('latin1');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Extraire les résidences via les liens vers les fiches individuelles.
    // Chaque résidence a 2 liens (icône + texte) — on garde ceux dont le texte
    // est le nom (pas un numéro de registre).
    $('a[href*="K10ConsFormAbg.asp"]').each((i, a) => {
      const href = $(a).attr('href') || '';
      const nom = $(a).text().trim();
      const registre = href.match(/Registre=(\d+)/)?.[1] || '';

      // Skip les liens "icône" dont le texte est le numéro de registre
      if (!nom || !registre || /^\d[\d\-]*$/.test(nom)) return;

      // La ville est dans la dernière cellule de la même ligne
      const parentTr = $(a).closest('tr');
      const cells = parentTr.find('td');
      const ville = cells.last().text().trim();

      residences.push({
        nom,
        ville: ville || regionName,
        code_postal: '',
        telephone: '',
        adresse: '',
        categorie: '',
        nb_unites: '',
        statut: 'Certifiée',
        region: regionName,
        region_code: regionCode,
        no_registre: registre,
      });
    });

  } catch (err) {
    console.error(`\n  ❌ Erreur région ${regionCode}: ${err.message}`);
  }

  return residences;
}

function saveCSV(records, filepath) {
  const headers = ['nom', 'ville', 'code_postal', 'telephone', 'adresse', 'categorie',
    'nb_unites', 'statut', 'region', 'region_code', 'no_registre'];
  const csv = stringify(records, { header: true, columns: headers });
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, '\uFEFF' + csv, 'utf8');
}

async function main() {
  console.log('🏥 Scraping du registre K10 MSSS...');
  console.log('📋 Source : http://k10.pub.msss.rtss.qc.ca');
  console.log('📊 Données disponibles sans login : région, numéro registre, nom, ville');
  console.log('   (adresse/téléphone/photos enrichis par Google Places — script 04)\n');

  const allResidences = [];
  let totalExpected = 0;

  for (const [code, name] of Object.entries(REGIONS)) {
    process.stdout.write(`Région ${code} — ${name.padEnd(32)}... `);
    const residences = await scrapeRegion(code, name);
    allResidences.push(...residences);
    totalExpected += residences.length;
    process.stdout.write(`${residences.length} résidences (total: ${allResidences.length})\n`);

    // Sauvegarde intermédiaire toutes les 3 régions
    if (Object.keys(REGIONS).indexOf(code) % 3 === 2) {
      saveCSV(allResidences, path.join(DATA_DIR, 'rpa_raw_partial.csv'));
    }

    await sleep(1200); // Respecter le serveur
  }

  console.log(`\n📊 Total brut : ${allResidences.length} entrées`);

  if (allResidences.length === 0) {
    console.error('\n⚠️  Aucune donnée récupérée.');
    console.error('Diagnostic : node test-scrape-laval.js');
    process.exit(1);
  }

  const outputPath = path.join(DATA_DIR, 'rpa_raw.csv');
  saveCSV(allResidences, outputPath);

  console.log(`✅ Sauvegardé : ${outputPath}`);
  console.log(`\n🔜 Prochaine étape : npm run clean`);
  console.log(`   Suivi : npm run geocode (nécessite ~30 min ou clé Google)`);
  console.log(`   Enrichissement: npm run enrich (nécessite GOOGLE_API_KEY)`);
  console.log(`   Import: npm run import (nécessite SUPABASE_URL + SUPABASE_SERVICE_KEY)`);
}

main();
