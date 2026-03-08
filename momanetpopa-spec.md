# 📋 Spec Sheet — momanetpopa.ca
### Annuaire des résidences pour aînés au Québec
*"Parce que le sous-sol, c'est pu une option."*

---

## 1. Vision & Positionnement

| Élément | Détail |
|---|---|
| **Nom de domaine** | momanetpopa.ca |
| **Tagline** | *Parce que le sous-sol, c'est pu une option.* |
| **Public cible** | Adultes 40–60 ans cherchant une résidence pour un parent |
| **Ton** | Familier, humoristique, honnête — 100% québécois |
| **Langues** | Français (primaire) + Anglais (secondaire) |
| **Marché** | Québec — ~1,800 RPAs certifiées |

---

## 2. Sources de données

### Phase 1 — Import initial (Semaine 1)
- **Registre MSSS** (data.gouv.qc.ca) : CSV public de toutes les RPAs certifiées
  - Champs disponibles : nom, adresse, téléphone, niveau de certification (1–6), nombre d'unités, région/MRC
  - Objectif : **1,800+ fiches dès le lancement**

### Phase 2 — Enrichissement automatique (Semaine 2–3)
- **Google Places API** : photos, notes, heures d'ouverture, site web, avis
- **Web scraping** : tarifs, services, description sur les sites des résidences

### Phase 3 — Contenu géré (Continu)
- Système de **réclamation de fiche** (claim) par les résidences
- Formulaire de **correction suggérée** par les usagers
- Mise à jour manuelle sur demande

---

## 3. Fonctionnalités du site

### Recherche & Filtres
- [ ] Recherche par ville, région, MRC
- [ ] Filtre par niveau de soins (autonome, semi-autonome, non-autonome)
- [ ] Filtre par fourchette de prix
- [ ] Filtre par langue de service (français, anglais, bilingue)
- [ ] Filtre par certification MSSS (niveau 1–6)
- [ ] Carte interactive (Google Maps) avec marqueurs

### Page de fiche (résidence)
- [ ] Nom, adresse, téléphone, site web
- [ ] Galerie photos
- [ ] Description des services et commodités
- [ ] Fourchette de prix mensuelle
- [ ] Niveau de certification MSSS + badge vérifié
- [ ] Note Google + avis
- [ ] Formulaire de contact / bouton click-to-call
- [ ] Bouton "Signaler une erreur"

### Comptes résidences
- [ ] Réclamation de fiche gratuite
- [ ] Tableau de bord : modifier photos, description, prix
- [ ] Notifications de leads reçus
- [ ] Statistiques de vues et clics

### Comptes familles (optionnel — Phase 2)
- [ ] Sauvegarder des favoris
- [ ] Comparer jusqu'à 3 résidences côte à côte
- [ ] Laisser un avis

---

## 4. Stack technique recommandé

### Option A — No-code / Rapide
| Composant | Outil |
|---|---|
| Base de données | Airtable |
| Site web | Softr ou Webflow |
| Carte | Google Maps API |
| Formulaires | Typeform / Jotform |
| Paiements | Stripe |

### Option B — Semi-custom (Recommandé)
| Composant | Outil |
|---|---|
| Frontend | Next.js (React) |
| Base de données | PostgreSQL (Supabase) |
| Carte | Google Maps API |
| Auth | Supabase Auth |
| Paiements | Stripe |
| Hébergement | Vercel |
| CMS | Notion ou Sanity (pour le contenu éditorial) |

---

## 5. Modèle de revenus

### Revenus récurrents (MRR)

| Tier | Prix/mois | Inclus |
|---|---|---|
| **Gratuit** | 0 $ | Fiche de base, données MSSS |
| **Standard** | 49 $/mois | Photos, description complète, badge vérifié |
| **Premium** | 149 $/mois | Placement prioritaire, stats, notifications leads |
| **Vedette** | 299 $/mois | Position #1 dans la région, bannière, contact direct |

### Revenus transactionnels

| Source | Tarif estimé |
|---|---|
| **Pay-per-lead** | 20–80 $ / lead qualifié |
| **Placement de résident (concierge)** | 500–2,000 $ / placement |
| **Publicité display** | CPM selon trafic |

### Partenariats
- Notaires spécialisés en droit des aînés
- Agences de soins à domicile (EESAD)
- Compagnies de déménagement
- Pharmacies et services de livraison de médicaments

---

## 6. Stratégie SEO

### Pages prioritaires
- Page d'accueil : `momanetpopa.ca`
- Pages par ville : `momanetpopa.ca/montreal`, `/laval`, `/quebec`, `/longueuil`, etc.
- Pages par type : `momanetpopa.ca/residence-autonome`, `/soins-specialises`
- Blogue : conseils pour familles, guide des RPAs, checklist de visite

### Mots-clés cibles (exemples)
- *résidence pour aînés Montréal*
- *maison de retraite Laval prix*
- *RPA Québec certifiée*
- *résidence personnes âgées Rive-Sud*
- *placement parent résidence Québec*

---

## 7. Marketing & acquisition

### Lancement
- [ ] Créer une page Facebook *momanetpopa.ca* avec ton humoristique
- [ ] Publier dans les groupes Facebook québécois pour proches aidants
- [ ] Pitch aux journalistes tech/culture québécois (le nom fait parler)
- [ ] TikTok / Reels : contenu éducatif + humour sur le placement des parents

### Acquisition résidences
- [ ] Campagne d'emails cold outreach aux 1,800 RPAs
- [ ] Partenariat avec associations de RPAs (ex: RQRA)
- [ ] Programme de référence entre résidences

### Acquisition familles
- [ ] Google Ads sur mots-clés d'intention forte
- [ ] Facebook Ads ciblant 40–60 ans, Québec
- [ ] Partenariat CLSC / travailleurs sociaux

---

## 8. KPIs & objectifs

| Indicateur | Objectif 6 mois | Objectif 12 mois |
|---|---|---|
| Fiches publiées | 1,800 (auto) | 1,800 enrichies |
| Résidences payantes | 50 | 200 |
| Visiteurs/mois | 5,000 | 25,000 |
| Leads générés/mois | 100 | 500 |
| MRR | 5,000 $ | 20,000 $ |

---

## 9. Phases de développement

### Phase 1 — MVP (0–4 semaines)
- Import du registre MSSS
- Affichage des fiches de base
- Recherche par ville + carte
- Site bilingue (FR/EN)

### Phase 2 — Enrichissement (1–3 mois)
- Intégration Google Places API
- Système de réclamation de fiche
- Fiches payantes (Standard + Premium)
- Formulaires de contact / leads

### Phase 3 — Croissance (3–6 mois)
- Service de placement concierge
- Comparateur de résidences
- Avis et notes utilisateurs
- Application mobile (PWA)

---

## 10. Risques & mitigation

| Risque | Mitigation |
|---|---|
| Données MSSS obsolètes | Bouton "signaler une erreur" + vérification annuelle |
| RPAs refusent les fiches | Valeur gratuite d'abord, payant ensuite |
| Nom perçu comme irrespectueux | Tester avec focus group, ajuster le ton si nécessaire |
| Concurrent copie le concept | Avance sur le SEO + relation avec les RPAs = moat |
| Réglementation sur les avis | Modération proactive, politique d'avis claire |

---

*Document préparé pour le projet momanetpopa.ca — v1.0*
