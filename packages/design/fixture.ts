/**
 * Unmapped Kairos · D1 fixture data.
 *
 * Direct port of `design-reference/data.js` into typed form.
 * Mock data only — production deployments will swap each Country in here
 * for a real adapter (ILOSTAT, WDI, Data360, Wittgenstein Centre).
 *
 * NOTHING in this file is hardcoded into components. Components read it
 * via the <CountryProvider> context.
 */

import type {
  AdjacentSkill,
  AmaraPersona,
  Country,
  CountryId,
  Opportunity,
  Skill,
  UnmappedFixture,
} from "./types";

const countries: Record<CountryId, Country> = {
  GH: {
    id: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    capital: "Accra",
    locale: {
      primary: "tw-GH",
      fallback: "en",
      script: "Latn",
      rtl: false,
      label: "Twi (Akan) · English fallback",
    },
    currency: "GHS",
    symbol: "GH₵",
    wageUnit: "monthly",
    sectorScheme: "ISIC-Rev4",
    taxonomy: { scheme: "WAEC SSCE → ISCED-2011", levels: "L0–L6" },
    opportunityTypes: ["formal", "self-employment", "apprenticeship"],
    automation: {
      digitalInfraScore: 0.42,
      alpha: 0.55,
      beta: 0.30,
      taskSrc: "ilo-step",
    },
    constraints: { bw: 280, sharedDevice: 0.61, access: "smartphone" },
    stats: {
      neet: 26.3,
      informal: 73.4,
      wage_youth: 1840,
      gdp_growth: 2.9,
      unemployment_youth: 14.7,
    },
    sectors: [
      ["Self-employment", 38],
      ["Agric.", 22],
      ["Retail", 14],
      ["Services", 11],
      ["Manuf.", 8],
      ["Public", 7],
    ],
    heatmap: [42, 31, 67, 19, 83, 52, 28, 71, 44, 58, 36, 49],
  },
  BD: {
    id: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    capital: "Dhaka",
    locale: {
      primary: "bn-BD",
      fallback: "en",
      script: "Beng",
      rtl: false,
      label: "Bangla (বাংলা)",
    },
    currency: "BDT",
    symbol: "৳",
    wageUnit: "monthly",
    sectorScheme: "ISIC-Rev4",
    taxonomy: { scheme: "SSC/HSC → ISCED-2011", levels: "L0–L6" },
    opportunityTypes: ["gig", "self-employment", "formal"],
    automation: {
      digitalInfraScore: 0.51,
      alpha: 0.50,
      beta: 0.34,
      taskSrc: "ilo-step",
    },
    constraints: { bw: 410, sharedDevice: 0.48, access: "smartphone" },
    stats: {
      neet: 30.9,
      informal: 84.9,
      wage_youth: 14200,
      gdp_growth: 5.8,
      unemployment_youth: 12.2,
    },
    sectors: [
      ["Manuf. (RMG)", 32],
      ["Agric.", 25],
      ["Gig/services", 17],
      ["Retail", 12],
      ["Construction", 8],
      ["Other", 6],
    ],
    heatmap: [28, 64, 39, 81, 47, 72, 33, 55, 68, 40, 52, 31],
  },
  MX: {
    id: "MX",
    name: "México",
    flag: "🇲🇽",
    capital: "CDMX",
    locale: {
      primary: "es-MX",
      fallback: "en",
      script: "Latn",
      rtl: false,
      label: "Español (MX)",
    },
    currency: "MXN",
    symbol: "$",
    wageUnit: "monthly",
    sectorScheme: "CNAE-equiv (local)",
    taxonomy: { scheme: "Bachillerato → ISCED-2011", levels: "L0–L7" },
    opportunityTypes: ["formal", "training", "self-employment"],
    automation: {
      digitalInfraScore: 0.68,
      alpha: 0.40,
      beta: 0.28,
      taskSrc: "ilo-future-of-work",
    },
    constraints: { bw: 850, sharedDevice: 0.31, access: "smartphone" },
    stats: {
      neet: 18.2,
      informal: 54.6,
      wage_youth: 8400,
      gdp_growth: 3.2,
      unemployment_youth: 6.5,
    },
    sectors: [
      ["Manuf.", 28],
      ["Servicios", 24],
      ["Comercio", 19],
      ["Construcción", 9],
      ["Agric.", 7],
      ["Otros", 13],
    ],
    heatmap: [55, 38, 72, 46, 29, 84, 51, 33, 67, 41, 60, 47],
  },
  BR: {
    id: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    capital: "Brasília",
    locale: {
      primary: "pt-BR",
      fallback: "en",
      script: "Latn",
      rtl: false,
      label: "Português (BR)",
    },
    currency: "BRL",
    symbol: "R$",
    wageUnit: "monthly",
    sectorScheme: "CNAE 2.0",
    taxonomy: { scheme: "Ensino Médio → ISCED-2011", levels: "L0–L7" },
    opportunityTypes: ["formal", "self-employment"],
    automation: {
      digitalInfraScore: 0.72,
      alpha: 0.38,
      beta: 0.26,
      taskSrc: "ilo-future-of-work",
    },
    constraints: { bw: 1020, sharedDevice: 0.27, access: "smartphone" },
    stats: {
      neet: 22.4,
      informal: 39.8,
      wage_youth: 2350,
      gdp_growth: 2.1,
      unemployment_youth: 14.9,
    },
    sectors: [
      ["Serviços", 31],
      ["Comércio", 22],
      ["Indústria", 18],
      ["Construção", 9],
      ["Agric.", 8],
      ["Outros", 12],
    ],
    heatmap: [40, 52, 35, 68, 73, 28, 49, 62, 31, 55, 38, 44],
  },
};

const amara: AmaraPersona = {
  name: "Amara Owusu",
  age: 22,
  location: "Madina, Accra",
  education: { credential: "WAEC SSCE", isced: 3 },
  languages: [
    ["Twi", "native"],
    ["Ga", "B2"],
    ["English", "B2"],
  ],
  rawExperiences: [
    "I fix smartphones at my uncle's kiosk — screens, batteries, software flashing. Started 5 years ago.",
    "Self-taught Python from YouTube; built a small inventory app for the kiosk.",
    "I help neighbours top up MTN MoMo and translate between Twi and English for traders.",
  ],
};

const esco: Skill[] = [
  {
    id: "esco_S3.4.2",
    label: "Mobile device repair",
    isco: "7421",
    verified: true,
    conf: 0.94,
    source: "Claude → ESCO; user-confirmed",
  },
  {
    id: "esco_S5.6.1",
    label: "Python programming",
    isco: "2512",
    verified: true,
    conf: 0.88,
    source: "Claude → ESCO; user-confirmed",
  },
  {
    id: "esco_S2.1.4",
    label: "Inventory record-keeping",
    isco: "4321",
    verified: true,
    conf: 0.81,
    source: "Claude → ESCO; user-confirmed",
  },
  {
    id: "esco_S6.2.3",
    label: "Mobile-money agent ops",
    isco: "4211",
    verified: true,
    conf: 0.78,
    source: "Self-decl. + transaction proof",
  },
  {
    id: "esco_L.tw-en",
    label: "Twi–English translation",
    isco: "2643",
    verified: false,
    conf: 0.62,
    source: "Self-declared (peer attestation pending)",
  },
];

const opportunities: Opportunity[] = [
  {
    id: "op1",
    title: "Phone-repair specialist",
    isco: "7421",
    employer: "Kiosk co-op (Madina)",
    type: "self-employment",
    wage: 1800,
    currency: "GHS",
    match: 96,
    distance_months: 0,
    growth: "+6% YoY",
    evidence: "Already practicing",
  },
  {
    id: "op2",
    title: "Inventory clerk — small retail",
    isco: "4321",
    employer: "Melcom, East Legon",
    type: "formal",
    wage: 1450,
    currency: "GHS",
    match: 84,
    distance_months: 1,
    growth: "+2% YoY",
    evidence: "Adjacent skill",
  },
  {
    id: "op3",
    title: "Junior Python developer (apprentice)",
    isco: "2512",
    employer: "MEST Africa",
    type: "apprenticeship",
    wage: 2200,
    currency: "GHS",
    match: 79,
    distance_months: 3,
    growth: "+11% YoY",
    evidence: "1 missing skill: Git",
  },
  {
    id: "op4",
    title: "Mobile-money agent",
    isco: "4211",
    employer: "MTN partner network",
    type: "self-employment",
    wage: 1300,
    currency: "GHS",
    match: 88,
    distance_months: 0,
    growth: "+4% YoY",
    evidence: "Already practicing",
  },
];

const adjacents: AdjacentSkill[] = [
  {
    from: "Mobile device repair",
    to: "IoT device technician",
    distance: 0.31,
    autoRisk: 0.18,
    growth: "+9%",
    dataSrc: "Data360 GH-2025",
  },
  {
    from: "Python programming",
    to: "Data analyst (entry)",
    distance: 0.42,
    autoRisk: 0.22,
    growth: "+14%",
    dataSrc: "ILOSTAT GH-2024",
  },
  {
    from: "Inventory record-keeping",
    to: "Logistics coordinator",
    distance: 0.38,
    autoRisk: 0.31,
    growth: "+7%",
    dataSrc: "Data360 GH-2025",
  },
];

const i18n: Record<string, Record<string, string>> = {
  en: {
    hi: "Welcome",
    skills: "Your skills",
    work: "Find work",
    learn: "Keep learning",
    verify: "Verify a skill",
    cont: "Continue",
  },
  tw: {
    hi: "Akwaaba",
    skills: "Wo nimdeɛ",
    work: "Hwehwɛ adwuma",
    learn: "Kɔ so sua",
    verify: "Si nimdeɛ so dua",
    cont: "Toa so",
  },
  bn: {
    hi: "স্বাগতম",
    skills: "আপনার দক্ষতা",
    work: "কাজ খুঁজুন",
    learn: "শেখা চালিয়ে যান",
    verify: "যাচাই করুন",
    cont: "চালিয়ে যান",
  },
  es: {
    hi: "Bienvenida",
    skills: "Tus habilidades",
    work: "Buscar trabajo",
    learn: "Sigue aprendiendo",
    verify: "Verificar habilidad",
    cont: "Continuar",
  },
  pt: {
    hi: "Bem-vinda",
    skills: "Suas habilidades",
    work: "Buscar trabalho",
    learn: "Continue aprendendo",
    verify: "Verificar habilidade",
    cont: "Continuar",
  },
};

export const FIXTURE: UnmappedFixture = {
  countries,
  amara,
  esco,
  opportunities,
  adjacents,
  i18n,
};

export const COUNTRY_IDS: CountryId[] = ["GH", "BD", "MX", "BR"];

export function isCountryId(value: string): value is CountryId {
  return (COUNTRY_IDS as string[]).includes(value);
}
