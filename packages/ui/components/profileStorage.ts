"use client";

import type { SkillsProfile, CountryId } from "@/packages/core/types";

const KEY_PREFIX = "unmapped:profile:";

export function profileKey(country: CountryId): string {
  return `${KEY_PREFIX}${country}`;
}

export function loadProfile(country: CountryId): SkillsProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(profileKey(country));
    if (!raw) return null;
    return JSON.parse(raw) as SkillsProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: SkillsProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    profileKey(profile.sourceCountryId),
    JSON.stringify(profile),
  );
}

export function deleteProfile(country: CountryId): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(profileKey(country));
}

export function newProfileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

interface DemoPersona {
  name: string;
  sourceLocale: SkillsProfile["sourceLocale"];
  credentials: SkillsProfile["credentials"];
  languages: SkillsProfile["languages"];
  skills: SkillsProfile["skills"];
  notes: string;
}

const DEMO_PERSONAS: Record<CountryId, (country: CountryId) => DemoPersona> = {
  GH: (country) => ({
    name: "Amara, 22, outside Accra — the brief's persona",
    sourceLocale: "en",
    credentials: [
      {
        // The brief: "holds a secondary school certificate" — in Ghana that
        // is the WASSCE/SSSCE issued by WAEC, ISCED level 3.
        localName: "WAEC Senior School Certificate (SSSCE/WASSCE)",
        iscedLevel: 3,
        year: 2020,
        countryId: country,
      },
    ],
    // The brief: "She speaks three languages." Twi is the most-spoken
    // Ghanaian language in Greater Accra; English is the country's official
    // working language; Hausa is widely used as a trade language across
    // Ghanaian markets, especially in informal trade.
    languages: [
      { code: "tw", level: "native", isPrimary: true },
      { code: "en", level: "B2" },
      { code: "ha", level: "B1" },
    ],
    skills: [
      {
        // The brief: "has been running a phone repair business since she was
        // 17" — at 22 that is 5 years.
        userText:
          "I've been running a phone repair business outside Accra since I was 17",
        yearsExperience: 5,
        proficiency: 4,
        esco: { uri: "S5.6.1", label: "Repair mobile phones", type: "skill" },
        isco: { code: "7421", label: "Electronics mechanics" },
        mappingConfidence: 0.94,
        userConfirmed: true,
      },
      {
        // Same business: she also runs the operation, not just the bench.
        userText:
          "I run the day-to-day of my phone repair shop — pricing, parts, customers",
        yearsExperience: 5,
        proficiency: 4,
        esco: {
          uri: "S7.2.1",
          label: "Small business management",
          type: "skill",
        },
        isco: { code: "1219", label: "Business managers" },
        mappingConfidence: 0.84,
        userConfirmed: true,
      },
      {
        // The brief: "taught herself basic coding from YouTube videos on a
        // shared mobile connection."
        userText:
          "I taught myself basic coding from YouTube on a shared mobile connection",
        proficiency: 2,
        esco: { uri: "S6.1.1", label: "Programming in Python", type: "skill" },
        isco: { code: "2512", label: "Software developers" },
        mappingConfidence: 0.78,
        userConfirmed: true,
      },
      {
        // Diagnosing electronic faults is core to a phone-repair workflow
        // and is a separate ESCO concept worth surfacing.
        userText: "I figure out what's wrong with broken phones by testing them",
        yearsExperience: 5,
        proficiency: 4,
        esco: {
          uri: "S5.6.2",
          label: "Diagnose electronic equipment faults",
          type: "skill",
        },
        isco: { code: "7421", label: "Electronics mechanics" },
        mappingConfidence: 0.9,
        userConfirmed: true,
      },
      {
        // Customer-facing repair shops involve real customer-service work.
        userText:
          "I deal with customers in person and on WhatsApp at the repair shop",
        yearsExperience: 5,
        proficiency: 4,
        esco: { uri: "S2.1.1", label: "Customer service", type: "skill" },
        mappingConfidence: 0.88,
        userConfirmed: true,
      },
    ],
    notes:
      "Amara, 22, lives outside Accra. Holds a secondary school certificate (WASSCE). Speaks three languages (Twi, English, Hausa). Has been running a phone repair business since age 17 and taught herself basic coding from YouTube on a shared mobile connection. To the formal economy she was unmapped; this profile is what Unmapped Kairos produces from her real skills.",
  }),

  BD: (country) => ({
    name: "Rina, 24, Dhaka garments district",
    sourceLocale: "en",
    credentials: [
      { localName: "HSC", iscedLevel: 3, year: 2019, countryId: country },
    ],
    languages: [
      { code: "bn", level: "native", isPrimary: true },
      { code: "en", level: "B1" },
    ],
    skills: [
      {
        userText: "I run a sewing machine in a garments factory",
        yearsExperience: 4,
        proficiency: 5,
        esco: { uri: "S3.1.1", label: "Operate sewing machine", type: "skill" },
        isco: { code: "7531", label: "Tailors, dressmakers" },
        mappingConfidence: 0.95,
        userConfirmed: true,
      },
      {
        userText: "I track stock and orders in a spreadsheet on my phone",
        yearsExperience: 2,
        proficiency: 3,
        esco: { uri: "S6.3.1", label: "Use spreadsheet software", type: "skill" },
        isco: { code: "4110", label: "General office clerks" },
        mappingConfidence: 0.82,
        userConfirmed: true,
      },
      {
        userText: "I help customers in our family shop",
        yearsExperience: 5,
        proficiency: 4,
        esco: { uri: "S2.1.1", label: "Customer service", type: "skill" },
        mappingConfidence: 0.86,
        userConfirmed: true,
      },
      {
        userText: "I keep small handwritten accounts for the shop",
        yearsExperience: 3,
        proficiency: 3,
        esco: { uri: "S7.1.1", label: "Bookkeeping", type: "skill" },
        isco: { code: "4311", label: "Accounting clerks" },
        mappingConfidence: 0.75,
        userConfirmed: true,
      },
    ],
    notes: "Rina — garments worker with informal admin experience.",
  }),

  MX: (country) => ({
    name: "Diego, 23, Estado de México",
    sourceLocale: "en",
    credentials: [
      {
        localName: "Bachillerato",
        iscedLevel: 3,
        year: 2020,
        countryId: country,
      },
      {
        localName: "TSU",
        iscedLevel: 5,
        year: 2022,
        countryId: country,
      },
    ],
    languages: [
      { code: "es", level: "native", isPrimary: true },
      { code: "en", level: "B2" },
    ],
    skills: [
      {
        userText: "I repair cars in my uncle's taller mecánico",
        yearsExperience: 4,
        proficiency: 4,
        esco: { uri: "S3.4.1", label: "Vehicle repair", type: "skill" },
        isco: { code: "7231", label: "Motor vehicle mechanics" },
        mappingConfidence: 0.93,
        userConfirmed: true,
      },
      {
        userText: "I learned Python doing online courses",
        proficiency: 3,
        esco: { uri: "S6.1.1", label: "Programming in Python", type: "skill" },
        isco: { code: "2512", label: "Software developers" },
        mappingConfidence: 0.84,
        userConfirmed: true,
      },
      {
        userText: "I built a simple website for my uncle's shop",
        proficiency: 3,
        esco: { uri: "S6.2.1", label: "Web development", type: "skill" },
        isco: { code: "2512", label: "Software developers" },
        mappingConfidence: 0.81,
        userConfirmed: true,
      },
      {
        userText: "I help customers and answer phone calls at the shop",
        yearsExperience: 3,
        proficiency: 4,
        esco: { uri: "S2.1.1", label: "Customer service", type: "skill" },
        mappingConfidence: 0.87,
        userConfirmed: true,
      },
      {
        userText: "I post promotions on Facebook and WhatsApp",
        yearsExperience: 2,
        proficiency: 3,
        esco: {
          uri: "S7.3.1",
          label: "Social media marketing",
          type: "skill",
        },
        mappingConfidence: 0.78,
        userConfirmed: true,
      },
    ],
    notes:
      "Diego — vehicle mechanic with self-taught coding + family-shop admin.",
  }),

  BR: (country) => ({
    name: "Júlia, 25, São Paulo",
    sourceLocale: "en",
    credentials: [
      {
        localName: "Ensino Médio Completo",
        iscedLevel: 3,
        year: 2018,
        countryId: country,
      },
      {
        localName: "Curso Técnico (SENAI)",
        iscedLevel: 4,
        year: 2020,
        countryId: country,
      },
    ],
    languages: [
      { code: "pt", level: "native", isPrimary: true },
      { code: "en", level: "B2" },
      { code: "es", level: "B1" },
    ],
    skills: [
      {
        userText: "I build websites for small businesses (HTML, CSS, JS)",
        yearsExperience: 3,
        proficiency: 4,
        esco: { uri: "S6.2.1", label: "Web development", type: "skill" },
        isco: { code: "2512", label: "Software developers" },
        mappingConfidence: 0.94,
        userConfirmed: true,
      },
      {
        userText: "I write JavaScript and learning React",
        yearsExperience: 2,
        proficiency: 4,
        esco: {
          uri: "S6.1.2",
          label: "Programming in JavaScript",
          type: "skill",
        },
        isco: { code: "2514", label: "Applications programmers" },
        mappingConfidence: 0.92,
        userConfirmed: true,
      },
      {
        userText: "I run social media for two small clients",
        yearsExperience: 2,
        proficiency: 4,
        esco: {
          uri: "S7.3.1",
          label: "Social media marketing",
          type: "skill",
        },
        mappingConfidence: 0.86,
        userConfirmed: true,
      },
      {
        userText: "I take care of my own freelance bookkeeping",
        yearsExperience: 2,
        proficiency: 3,
        esco: { uri: "S7.1.1", label: "Bookkeeping", type: "skill" },
        mappingConfidence: 0.74,
        userConfirmed: true,
      },
      {
        userText: "I handle client requests on WhatsApp and email",
        proficiency: 5,
        esco: { uri: "S2.1.1", label: "Customer service", type: "skill" },
        mappingConfidence: 0.89,
        userConfirmed: true,
      },
    ],
    notes:
      "Júlia — junior web developer + freelance social-media work.",
  }),
};

/**
 * Seed a country-appropriate demo profile so the modules light up without
 * typing through the intake form. Each country has its own persona — Amara
 * (GH), Rina (BD), Diego (MX), Júlia (BR) — and their skills are mapped to
 * ESCO/ISCO codes that exist in our data snapshots, so risk + matching +
 * dashboard all produce real results.
 */
export function seedAmaraProfile(country: CountryId): SkillsProfile {
  const now = new Date().toISOString();
  const builder = DEMO_PERSONAS[country] ?? DEMO_PERSONAS.GH;
  const persona = builder(country);
  // Stamp every demo skill with an explicit source string so the per-skill
  // attribution line on the Profile page shows where the mapping came from.
  // (In real intake the source comes from packages/llm/skillExtraction.ts.)
  const skills = persona.skills.map((s) => ({
    ...s,
    source: s.source ?? "Demo seed · pre-confirmed",
  }));
  return {
    version: "1",
    id: newProfileId(),
    sourceCountryId: country,
    sourceLocale: persona.sourceLocale,
    originCountryId: country,
    credentials: persona.credentials,
    languages: persona.languages,
    skills,
    notes: persona.notes,
    meta: { createdAt: now, updatedAt: now },
  };
}

/** Seed all four country demo profiles into localStorage at once. */
export function seedAllDemoProfiles(): CountryId[] {
  const ids: CountryId[] = ["GH", "BD", "MX", "BR"];
  for (const id of ids) {
    saveProfile(seedAmaraProfile(id));
  }
  return ids;
}

/** Return a human label for the demo persona of a given country. */
export function demoPersonaLabel(country: CountryId): string {
  const builder = DEMO_PERSONAS[country];
  return builder ? builder(country).name : "Demo profile";
}

/**
 * Rich, display-ready info for a country's demo persona — used by the
 * profile page to render the avatar + bio block. Keep these short; one
 * sentence each. Initials drive the photo placeholder.
 */
export interface PersonaMeta {
  name: string;
  initials: string;
  age: number;
  location: string;
  /** One-line headline, ≤ 80 chars. */
  headline: string;
  /** 1–3 sentences. Reads like a short bio. */
  bio: string;
  /** Coral-on-paper or paper-on-coral, used as avatar background hue. */
  accent: "coral" | "teal" | "moss" | "amber";
}

const PERSONA_META: Record<CountryId, PersonaMeta> = {
  GH: {
    name: "Amara Owusu",
    initials: "AO",
    age: 22,
    location: "Madina, Greater Accra · Ghana",
    headline:
      "Phone-repair entrepreneur since 17, self-taught coder on shared mobile.",
    bio:
      "Holds a WAEC senior school certificate and speaks three languages. " +
      "Built her own phone-repair business outside Accra at 17 and runs both " +
      "the bench and the books. Taught herself the basics of coding from " +
      "YouTube on a shared mobile connection — exactly the kind of skill the " +
      "formal economy never sees.",
    accent: "coral",
  },
  BD: {
    name: "Rina Akter",
    initials: "RA",
    age: 24,
    location: "Mirpur, Dhaka · Bangladesh",
    headline:
      "Garments-factory operator with informal admin and bookkeeping experience.",
    bio:
      "Holds a Higher Secondary Certificate (HSC). Operates a sewing line in a " +
      "ready-made-garments factory and helps run her family's neighbourhood " +
      "shop after hours — tracking inventory in a spreadsheet on her phone " +
      "and keeping the books by hand.",
    accent: "teal",
  },
  MX: {
    name: "Diego Ramírez",
    initials: "DR",
    age: 23,
    location: "Estado de México, MX · México",
    headline:
      "Vehicle mechanic with self-taught coding and family-shop operations.",
    bio:
      "Bachillerato + TSU técnico. Repairs cars in his uncle's taller mecánico, " +
      "learned Python through online courses, and built the shop's first " +
      "website. Posts the shop's promotions on WhatsApp and Facebook himself.",
    accent: "moss",
  },
  BR: {
    name: "Júlia Pereira",
    initials: "JP",
    age: 25,
    location: "Zona Leste, São Paulo · Brasil",
    headline:
      "Junior web developer + freelance social-media marketer.",
    bio:
      "Ensino Médio + SENAI técnico. Builds websites for small businesses in " +
      "HTML/CSS/JS and is learning React. Runs paid social-media work for two " +
      "small clients and keeps her own freelance bookkeeping.",
    accent: "amber",
  },
};

export function getPersonaMeta(country: CountryId): PersonaMeta {
  return PERSONA_META[country] ?? PERSONA_META.GH;
}
