export type Article = {
  slug: string;
  titre: string;
  description: string;
  date: string;
  tempsLecture: string;
  categorie: string;
  contenu: string; // HTML simple
};

export type BilingualArticle = {
  fr: Article;
  en: Article;
};

export const articleData: BilingualArticle[] = [
  {
    fr: {
      slug: "comment-choisir-rpa-quebec",
      titre: "Comment choisir une résidence pour aînés au Québec : le guide complet",
      description:
        "Catégories MSSS, visites, questions à poser, coûts — tout ce qu'il faut savoir avant de choisir une RPA pour un proche.",
      date: "2026-01-15",
      tempsLecture: "8 min",
      categorie: "Guide",
      contenu: `
<p>Choisir une résidence pour aînés (RPA) est l'une des décisions les plus importantes qu'une famille puisse prendre. Au Québec, il existe plus de 3 600 résidences certifiées, réparties en 4 catégories selon le niveau de soins offerts. Ce guide vous aide à vous y retrouver.</p>

<h2>Les 4 catégories de résidences au Québec</h2>
<p>Le ministère de la Santé et des Services sociaux (MSSS) certifie les RPAs selon 4 catégories :</p>
<ul>
  <li><strong>Catégorie 1</strong> : Services de base — repas, sécurité, activités sociales. Pour personnes autonomes.</li>
  <li><strong>Catégorie 2</strong> : Services intermédiaires — aide aux activités quotidiennes (bain, habillement). Semi-autonomes.</li>
  <li><strong>Catégorie 3</strong> : Services de soins — soins infirmiers sur place 24h/24. Personnes avec perte d'autonomie significative.</li>
  <li><strong>Catégorie 4</strong> : Soins spécialisés — pour personnes atteintes de démence, Alzheimer ou autres maladies cognitives.</li>
</ul>

<h2>Les questions essentielles à poser lors d'une visite</h2>
<p>Avant de signer quoi que ce soit, visitez la résidence en personne — idéalement à l'heure des repas — et posez ces questions :</p>
<ul>
  <li>Quel est le ratio préposés/résidents pendant la nuit ?</li>
  <li>Y a-t-il un infirmier ou une infirmière sur place 24h/24 ?</li>
  <li>Quels sont les frais mensuels exacts, et qu'est-ce qui est inclus ?</li>
  <li>Quelle est la politique en cas de hausse de soins requis ?</li>
  <li>Y a-t-il une liste d'attente ? Combien de temps ?</li>
  <li>Est-ce que je peux visiter les chambres, les salles communes et la cuisine ?</li>
</ul>

<h2>Les coûts à prévoir</h2>
<p>Les prix varient énormément selon la région et la catégorie. À titre indicatif :</p>
<ul>
  <li>Catégorie 1 : 1 800 $ à 3 500 $ par mois</li>
  <li>Catégorie 2 : 2 500 $ à 4 500 $ par mois</li>
  <li>Catégorie 3-4 : 4 000 $ à 7 000 $ par mois et plus</li>
</ul>
<p>Le programme de supplément au loyer (PSL) et les crédits d'impôt pour aidants naturels peuvent réduire significativement ces coûts.</p>

<h2>Les signaux d'alarme à surveiller</h2>
<p>Méfiez-vous si :</p>
<ul>
  <li>La direction refuse de vous laisser visiter sans rendez-vous</li>
  <li>Les résidents semblent isolés ou peu stimulés</li>
  <li>Les odeurs sont persistantes (signe de manque de personnel)</li>
  <li>Le contrat est flou sur les conditions de résiliation</li>
</ul>

<h2>La certification MSSS : votre filet de sécurité</h2>
<p>Toutes les résidences de notre répertoire sont certifiées par le MSSS. Cette certification garantit des inspections régulières et le respect des normes minimales. Vous pouvez vérifier le statut de certification directement via le registre officiel.</p>
    `,
    },
    en: {
      slug: "how-to-choose-seniors-residence-quebec",
      titre: "How to Choose a Senior Residence in Quebec: The Complete Guide",
      description:
        "MSSS categories, visits, questions to ask, costs — everything you need to know before choosing an RPA for a loved one.",
      date: "2026-01-15",
      tempsLecture: "8 min",
      categorie: "Guide",
      contenu: `
<p>Choosing a senior residence (RPA) is one of the most important decisions a family can make. In Quebec, there are over 3,600 certified residences, divided into 4 categories based on the level of care provided. This guide helps you navigate your options.</p>

<h2>The 4 Categories of Residences in Quebec</h2>
<p>The Ministry of Health and Social Services (MSSS) certifies RPAs according to 4 categories:</p>
<ul>
  <li><strong>Category 1</strong>: Basic services — meals, security, social activities. For autonomous individuals.</li>
  <li><strong>Category 2</strong>: Intermediate services — assistance with daily activities (bathing, dressing). Semi-autonomous.</li>
  <li><strong>Category 3</strong>: Care services — nursing care on site 24/7. For people with significant loss of autonomy.</li>
  <li><strong>Category 4</strong>: Specialized care — for people with dementia, Alzheimer's or other cognitive conditions.</li>
</ul>

<h2>Essential Questions to Ask During a Visit</h2>
<p>Before signing anything, visit the residence in person — ideally at meal time — and ask these questions:</p>
<ul>
  <li>What is the staff-to-resident ratio at night?</li>
  <li>Is there a nurse on site 24/7?</li>
  <li>What are the exact monthly fees, and what is included?</li>
  <li>What is the policy if more care is needed?</li>
  <li>Is there a waiting list? How long?</li>
  <li>Can I visit the rooms, common areas and kitchen?</li>
</ul>

<h2>Costs to Expect</h2>
<p>Prices vary greatly by region and category. As a rough guide:</p>
<ul>
  <li>Category 1: $1,800 to $3,500 per month</li>
  <li>Category 2: $2,500 to $4,500 per month</li>
  <li>Category 3–4: $4,000 to $7,000+ per month</li>
</ul>
<p>The rent supplement program (PSL) and caregiver tax credits can significantly reduce these costs.</p>

<h2>Warning Signs to Watch For</h2>
<p>Be cautious if:</p>
<ul>
  <li>Management refuses to let you visit without an appointment</li>
  <li>Residents seem isolated or understimulated</li>
  <li>Persistent odours (a sign of understaffing)</li>
  <li>The contract is vague about cancellation terms</li>
</ul>

<h2>MSSS Certification: Your Safety Net</h2>
<p>All residences in our directory are certified by the MSSS. This certification ensures regular inspections and compliance with minimum standards. You can verify certification status directly via the official registry.</p>
    `,
    },
  },
  {
    fr: {
      slug: "differences-rpa-chsld-ressource-intermediaire",
      titre: "RPA, CHSLD, ressource intermédiaire : quelles différences ?",
      description:
        "Confused by all the acronyms? On vous explique clairement la différence entre une RPA, un CHSLD et une ressource intermédiaire au Québec.",
      date: "2026-02-03",
      tempsLecture: "5 min",
      categorie: "Explications",
      contenu: `
<p>Quand vient le temps de trouver un hébergement pour un proche âgé, le système québécois peut sembler complexe. RPA, CHSLD, RI-RTF... voici un guide rapide pour démêler tout ça.</p>

<h2>La RPA (Résidence privée pour aînés)</h2>
<p>C'est ce que vous trouverez sur Moman et Popa. Une RPA est un immeuble locatif privé qui offre, en plus d'un logement, des services d'assistance et de soins à des personnes âgées de 65 ans et plus. Elle est certifiée par le MSSS.</p>
<p><strong>Pour qui :</strong> Personnes autonomes à semi-autonomes, jusqu'aux personnes avec perte d'autonomie importante (catégorie 4).</p>
<p><strong>Financement :</strong> Privé — payé par le résident, parfois avec aide gouvernementale (PSL, crédit d'impôt).</p>

<h2>Le CHSLD (Centre d'hébergement et de soins de longue durée)</h2>
<p>Un CHSLD est un établissement public (ou privé conventionné) pour personnes en grande perte d'autonomie qui ne peuvent plus vivre à domicile ni en RPA.</p>
<p><strong>Pour qui :</strong> Personnes avec perte d'autonomie sévère, nécessitant des soins médicaux continus.</p>
<p><strong>Financement :</strong> Largement subventionné — coût au résident calculé selon ses revenus (max ~1 800 $/mois en 2025).</p>
<p><strong>Accès :</strong> Via le CLSC de votre région — il faut une évaluation de l'autonomie (outil SMAF).</p>

<h2>La ressource intermédiaire (RI) et la ressource de type familial (RTF)</h2>
<p>Une RI ou RTF est un milieu de vie de petite taille (souvent une maison ou un petit immeuble) où une personne ou un couple accueille des résidents. C'est à mi-chemin entre le domicile et le CHSLD.</p>
<p><strong>Pour qui :</strong> Personnes avec perte d'autonomie modérée à sévère, souvent des personnes ayant des besoins de santé mentale ou une déficience intellectuelle.</p>
<p><strong>Financement :</strong> Subventionné par le réseau de la santé — peu ou pas de frais pour le résident.</p>

<h2>En résumé</h2>
<table>
  <thead>
    <tr><th>Type</th><th>Autonomie</th><th>Coût</th><th>Accès</th></tr>
  </thead>
  <tbody>
    <tr><td>RPA</td><td>Autonome à perte importante</td><td>1 800 $ – 7 000 $/mois</td><td>Direct</td></tr>
    <tr><td>CHSLD</td><td>Perte sévère</td><td>Selon revenus</td><td>Via CLSC</td></tr>
    <tr><td>RI/RTF</td><td>Modérée à sévère</td><td>Subventionné</td><td>Via CLSC</td></tr>
  </tbody>
</table>
    `,
    },
    en: {
      slug: "differences-rpa-chsld-intermediate-resource",
      titre: "RPA, CHSLD, Intermediate Resource: What Are the Differences?",
      description:
        "Confused by all the acronyms? We clearly explain the difference between an RPA, a CHSLD and an intermediate resource in Quebec.",
      date: "2026-02-03",
      tempsLecture: "5 min",
      categorie: "Explanations",
      contenu: `
<p>When the time comes to find accommodation for an elderly loved one, the Quebec system can seem complex. RPA, CHSLD, RI-RTF... here is a quick guide to sort it all out.</p>

<h2>The RPA (Private Senior Residence)</h2>
<p>This is what you will find on Place 65+. An RPA is a private rental building that offers, in addition to housing, assistance and care services for people aged 65 and over. It is certified by the MSSS.</p>
<p><strong>For whom:</strong> Autonomous to semi-autonomous individuals, up to those with significant loss of autonomy (category 4).</p>
<p><strong>Funding:</strong> Private — paid by the resident, sometimes with government assistance (PSL, tax credit).</p>

<h2>The CHSLD (Long-Term Care Center)</h2>
<p>A CHSLD is a public (or privately contracted) facility for people with a major loss of autonomy who can no longer live at home or in an RPA.</p>
<p><strong>For whom:</strong> People with severe loss of autonomy, requiring continuous medical care.</p>
<p><strong>Funding:</strong> Largely subsidized — cost to the resident calculated based on income (max ~$1,800/month in 2025).</p>
<p><strong>Access:</strong> Through the CLSC in your area — an autonomy assessment (SMAF tool) is required.</p>

<h2>Intermediate Resources (RI) and Family-Type Resources (RTF)</h2>
<p>An RI or RTF is a small living environment (often a house or small building) where a person or couple welcomes residents. It is halfway between a private home and a CHSLD.</p>
<p><strong>For whom:</strong> People with moderate to severe loss of autonomy, often with mental health needs or intellectual disabilities.</p>
<p><strong>Funding:</strong> Subsidized by the health network — little or no cost to the resident.</p>

<h2>Summary</h2>
<table>
  <thead>
    <tr><th>Type</th><th>Autonomy</th><th>Cost</th><th>Access</th></tr>
  </thead>
  <tbody>
    <tr><td>RPA</td><td>Autonomous to significant loss</td><td>$1,800 – $7,000/month</td><td>Direct</td></tr>
    <tr><td>CHSLD</td><td>Severe loss</td><td>Based on income</td><td>Via CLSC</td></tr>
    <tr><td>RI/RTF</td><td>Moderate to severe</td><td>Subsidized</td><td>Via CLSC</td></tr>
  </tbody>
</table>
    `,
    },
  },
  {
    fr: {
      slug: "aides-financieres-residence-aines-quebec",
      titre: "Aides financières pour la résidence pour aînés au Québec en 2026",
      description:
        "Crédit d'impôt pour maintien à domicile, supplément au loyer, allocation logement — toutes les aides disponibles pour payer une RPA au Québec.",
      date: "2026-02-20",
      tempsLecture: "6 min",
      categorie: "Finances",
      contenu: `
<p>Le coût d'une résidence pour aînés peut peser lourd sur le budget d'un aîné ou de sa famille. Heureusement, plusieurs programmes gouvernementaux existent pour alléger la facture.</p>

<h2>1. Le crédit d'impôt pour le maintien à domicile</h2>
<p>Ce crédit provincial s'applique aux aînés de 70 ans et plus qui vivent dans une RPA. Il couvre 36 % des dépenses admissibles pour les services de maintien à domicile (soins, aide à la personne, repas, etc.), jusqu'à un maximum de 19 500 $ de dépenses.</p>
<p><strong>À retenir :</strong> Vous pouvez demander des versements anticipés trimestriels plutôt que d'attendre le remboursement lors de votre déclaration de revenus.</p>

<h2>2. Le Programme de supplément au loyer (PSL)</h2>
<p>Ce programme fédéral-provincial permet à des ménages à faibles revenus de payer un loyer calculé selon leur capacité de payer (environ 25 % de leurs revenus). La différence est versée directement à la résidence.</p>
<p><strong>Comment y accéder :</strong> Via votre municipalité ou office municipal d'habitation (OMH). Les listes d'attente peuvent être longues — inscrivez-vous tôt.</p>

<h2>3. L'allocation-logement du Québec</h2>
<p>Ce programme verse jusqu'à 170 $/mois aux personnes âgées à faibles revenus qui consacrent plus de 30 % de leur revenu à leur loyer. Disponible pour les locataires de RPA.</p>

<h2>4. Le crédit d'impôt pour aidants naturels</h2>
<p>Si vous soutenez financièrement un proche en RPA, vous pouvez avoir droit à un crédit provincial. Le montant varie selon votre situation et votre lien avec l'aidé.</p>

<h2>5. La déduction pour frais médicaux</h2>
<p>Certaines dépenses en RPA (soins infirmiers, médicaments, frais médicaux) sont déductibles d'impôt. Conservez toutes vos factures et consultez un comptable pour maximiser ces déductions.</p>

<h2>Par où commencer ?</h2>
<p>Appelez votre CLSC — ils ont des travailleurs sociaux qui peuvent vous orienter vers tous les programmes auxquels vous avez droit. C'est gratuit et ça peut faire économiser des milliers de dollars par année.</p>
    `,
    },
    en: {
      slug: "financial-aid-seniors-residence-quebec",
      titre: "Financial Aid for Senior Residences in Quebec in 2026",
      description:
        "Home maintenance tax credit, rent supplement, housing allowance — all available programs to help pay for an RPA in Quebec.",
      date: "2026-02-20",
      tempsLecture: "6 min",
      categorie: "Finances",
      contenu: `
<p>The cost of a senior residence can weigh heavily on the budget of a senior or their family. Fortunately, several government programs exist to lighten the load.</p>

<h2>1. The Home Maintenance Tax Credit</h2>
<p>This provincial credit applies to seniors aged 70 and over living in an RPA. It covers 36% of eligible expenses for home maintenance services (care, personal assistance, meals, etc.), up to a maximum of $19,500 in expenses.</p>
<p><strong>Key point:</strong> You can request quarterly advance payments rather than waiting for a refund at tax time.</p>

<h2>2. The Rent Supplement Program (PSL)</h2>
<p>This federal-provincial program allows low-income households to pay rent calculated according to their ability to pay (approximately 25% of their income). The difference is paid directly to the residence.</p>
<p><strong>How to access it:</strong> Through your municipality or municipal housing office (OMH). Waiting lists can be long — register early.</p>

<h2>3. Quebec's Housing Allowance</h2>
<p>This program pays up to $170/month to low-income seniors who spend more than 30% of their income on rent. Available to RPA tenants.</p>

<h2>4. The Caregiver Tax Credit</h2>
<p>If you are financially supporting a loved one in an RPA, you may be entitled to a provincial credit. The amount varies depending on your situation and your relationship with the person being supported.</p>

<h2>5. The Medical Expense Deduction</h2>
<p>Certain RPA expenses (nursing care, medications, medical fees) are tax-deductible. Keep all your receipts and consult an accountant to maximize these deductions.</p>

<h2>Where to Start?</h2>
<p>Call your CLSC — they have social workers who can direct you to all the programs you are entitled to. It is free and can save thousands of dollars per year.</p>
    `,
    },
  },
];

// Flat list of articles for a given locale
export function getArticlesForLocale(locale: string): Article[] {
  return articleData.map((b) => (locale === "en" ? b.en : b.fr));
}

// Legacy export for backward compatibility (French articles)
export const articles: Article[] = articleData.map((b) => b.fr);

// Get a single article by slug, optionally locale-aware
export function getArticle(slug: string, locale?: string): Article | undefined {
  if (locale === "en") {
    return articleData.map((b) => b.en).find((a) => a.slug === slug);
  }
  // Default: search both locales (fr first, then en fallback)
  const frArticle = articleData.map((b) => b.fr).find((a) => a.slug === slug);
  if (frArticle) return frArticle;
  return articleData.map((b) => b.en).find((a) => a.slug === slug);
}
