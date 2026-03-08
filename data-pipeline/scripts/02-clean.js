/**
 * Script 02 — Nettoyer et dédupliquer les données brutes
 * Entrée  : data/rpa_raw.csv  (ou rpa_msss.csv si CSV gouvernemental)
 * Résultat: data/rpa_propre.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Cherche le fichier source dans cet ordre
function findInputFile() {
  const candidates = [
    'rpa_msss.csv',       // CSV gouvernemental téléchargé manuellement
    'rpa_raw.csv',        // Résultat du scraper K10
    'rpa_scraped.csv',    // Résultat alternatif
  ];
  for (const name of candidates) {
    const p = path.join(DATA_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function formatPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

function normalizePostal(raw) {
  if (!raw) return '';
  return raw.toUpperCase().trim().replace(/\s+/g, ' ');
}

function titleCase(str) {
  if (!str) return '';
  // Garde les majuscules intentionnelles (ex: "CHSLD"), normalise le reste
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Normalise un numéro de téléphone pour la déduplication
function phoneKey(raw) {
  return raw ? raw.replace(/\D/g, '') : '';
}

// Normalise un nom+ville pour la déduplication (quand pas d'adresse)
function nomVilleKey(nom, ville) {
  const n = (nom || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const v = (ville || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `${n}|${v}`;
}

function main() {
  const inputPath = findInputFile();
  if (!inputPath) {
    console.error('❌ Aucun fichier CSV trouvé dans data/');
    console.error('   Dépose rpa_msss.csv (CSV gouvernemental) ou lance d\'abord npm run scrape');
    process.exit(1);
  }

  console.log(`📂 Lecture de : ${path.basename(inputPath)}`);
  const raw = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, ''); // retire BOM
  const records = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
  console.log(`   ${records.length} entrées brutes`);

  // Mapper les colonnes selon la source (K10 scraper ou CSV gouvernemental)
  const normalized = records.map(r => {
    // Essaie les noms de colonnes communs
    const nom = r.nom || r['Nom de la résidence'] || r['NOM_ETABLISSEMENT'] || r.name || '';
    const adresse = r.adresse || r['Adresse'] || r['ADRESSE'] || '';
    const ville = r.ville || r['Municipalité'] || r['MUNICIPALITE'] || r['VILLE'] || '';
    const code_postal = r.code_postal || r['Code postal'] || r['CODE_POSTAL'] || '';
    const telephone = r.telephone || r['Téléphone'] || r['TELEPHONE'] || '';
    const categorie = r.categorie || r['Catégorie'] || r['CATEGORIE'] || '';
    const nb_unites = r.nb_unites || r["Nombre d'unités"] || r['NB_UNITES'] || '';
    const statut = r.statut || r['Statut'] || r['STATUT'] || 'Certifiée';
    const region = r.region || r['Région'] || r['REGION'] || '';
    const mrc = r.mrc || r['MRC'] || '';

    return {
      nom: titleCase(nom),
      adresse: titleCase(adresse),
      ville: titleCase(ville),
      code_postal: normalizePostal(code_postal),
      telephone: formatPhone(telephone),
      categorie: categorie.trim(),
      nb_unites: parseInt(nb_unites) || null,
      statut: statut.trim(),
      region: region.trim(),
      mrc: mrc.trim(),
      // Colonnes à enrichir plus tard
      latitude: '',
      longitude: '',
      site_web: '',
      photo_url: '',
      note_google: '',
      nb_avis_google: '',
      prix_min: '',
      prix_max: '',
      description: '',
      langue_service: 'francais',
    };
  });

  // Filtrer les entrées invalides (sans nom ou ville)
  const valid = normalized.filter(r => r.nom && r.ville);
  console.log(`   ${valid.length} entrées valides (${records.length - valid.length} filtrées)`);

  // Dédupliquer : même téléphone → garder la première occurrence
  const seenPhone = new Set();
  const seenNomVille = new Set();
  const deduped = [];

  for (const r of valid) {
    const phone = phoneKey(r.telephone);
    const key = nomVilleKey(r.nom, r.ville);

    // Skip si téléphone déjà vu (et valide)
    if (phone && phone.length >= 10 && seenPhone.has(phone)) {
      continue;
    }

    // Skip si nom+ville exactement identiques (vrai doublon)
    if (key && seenNomVille.has(key)) {
      continue;
    }

    if (phone.length >= 10) seenPhone.add(phone);
    if (key) seenNomVille.add(key);
    deduped.push(r);
  }

  console.log(`   ${deduped.length} résidences après déduplication (${valid.length - deduped.length} doublons retirés)`);

  // Ajouter l'adresse complète pour le géocodage
  const withFullAddress = deduped.map(r => ({
    ...r,
    adresse_complete: [r.adresse, r.ville, 'QC', r.code_postal, 'Canada']
      .filter(Boolean)
      .join(', '),
  }));

  // Sauvegarder
  const outputPath = path.join(DATA_DIR, 'rpa_propre.csv');
  const headers = [
    'nom', 'adresse', 'ville', 'code_postal', 'telephone', 'categorie',
    'nb_unites', 'statut', 'region', 'mrc', 'adresse_complete',
    'latitude', 'longitude', 'site_web', 'photo_url',
    'note_google', 'nb_avis_google', 'prix_min', 'prix_max',
    'description', 'langue_service',
  ];
  const csv = stringify(withFullAddress, { header: true, columns: headers });
  fs.writeFileSync(outputPath, '\uFEFF' + csv, 'utf8');

  console.log(`\n✅ Sauvegardé : ${outputPath}`);
  console.log(`📊 ${withFullAddress.length} résidences prêtes pour le géocodage`);
}

main();
