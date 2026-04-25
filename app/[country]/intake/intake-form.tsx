"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/packages/ui/components/cn";
import {
  loadProfile,
  newProfileId,
  saveProfile,
} from "@/packages/ui/components/profileStorage";
import type { CommonDict } from "@/packages/core/i18n";
import type {
  CountryId,
  IscedLevel,
  LocaleId,
  SkillsProfile,
  VerifiedSkill,
} from "@/packages/core/types";

interface EducationOption {
  id: string;
  label: string;
  iscedEquivalent: IscedLevel;
}

interface ExperienceDraft {
  text: string;
  years?: string;
  proficiency?: number;
}

interface LanguageDraft {
  code: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";
}

interface ExtractedSkill {
  userText: string;
  escoUri: string | null;
  label: string;
  confidence: number;
  reasoning: string;
  yearsExperience?: number;
}

interface Props {
  countryId: CountryId;
  locale: LocaleId;
  educationLevels: EducationOption[];
  dict: CommonDict;
}

const STEPS = ["education", "languages", "experience", "review"] as const;
type Step = (typeof STEPS)[number];

export function IntakeForm({ countryId, locale, educationLevels, dict }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("education");

  // Education state
  const [educationLevelId, setEducationLevelId] = useState<string>("");
  const [credentialName, setCredentialName] = useState<string>("");

  // Language state
  const [languages, setLanguages] = useState<LanguageDraft[]>([
    { code: locale, level: "native" },
  ]);

  // Experience state
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([
    { text: "" },
  ]);

  // Mapping state
  const [extracting, setExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([]);
  // The non-empty experience drafts that produced `extractedSkills`, in
  // the same order. Kept aligned so years/proficiency don't drift onto
  // the wrong skill when earlier rows were left blank.
  const [reviewedDrafts, setReviewedDrafts] = useState<ExperienceDraft[]>([]);
  const [confirmedFlags, setConfirmedFlags] = useState<Record<number, boolean>>(
    {},
  );
  // Provenance for the source string we stamp on each saved VerifiedSkill.
  const [extractionMeta, setExtractionMeta] = useState<{
    usedLLM: boolean;
    provider?: "openai" | "anthropic";
    model?: string;
  }>({ usedLLM: false });

  function next() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }
  function back() {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  }

  async function runExtraction() {
    const drafts = experiences.filter((e) => e.text.trim());
    if (drafts.length === 0) {
      setExtractedSkills([]);
      setReviewedDrafts([]);
      setConfirmedFlags({});
      setStep("review");
      return;
    }
    // Lock in the same filtered list that we send to the API so that
    // saveAndContinue can index back into it without drifting.
    setReviewedDrafts(drafts);
    const inputs = drafts.map((d) => d.text);
    setExtracting(true);
    try {
      const res = await fetch("/api/extract-skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ country: countryId, inputs }),
      });
      if (!res.ok) throw new Error("extract failed");
      const data: {
        skills: ExtractedSkill[];
        usedLLM?: boolean;
        usage?: { provider?: "openai" | "anthropic"; model?: string };
      } = await res.json();
      setExtractedSkills(data.skills);
      setExtractionMeta({
        usedLLM: !!data.usedLLM,
        provider: data.usage?.provider,
        model: data.usage?.model,
      });
      // Pre-confirm high-confidence mappings
      const flags: Record<number, boolean> = {};
      data.skills.forEach((s, i) => {
        flags[i] = s.confidence >= 0.7;
      });
      setConfirmedFlags(flags);
    } catch (err) {
      console.error(err);
      // Fall back: mark all as unconfirmed using the same drafts list
      setExtractedSkills(
        drafts.map((d) => ({
          userText: d.text,
          escoUri: null,
          label: d.text,
          confidence: 0,
          reasoning: dict.common.error,
        })),
      );
      setConfirmedFlags({});
      setExtractionMeta({ usedLLM: false });
    } finally {
      setExtracting(false);
    }
  }

  function buildSourceString(confirmed: boolean): string {
    const verdict = confirmed ? "user-confirmed" : "pending review";
    if (extractionMeta.usedLLM) {
      const provider =
        extractionMeta.provider === "openai" ? "OpenAI" : "Claude";
      const model = extractionMeta.model
        ? ` · ${extractionMeta.model}`
        : "";
      return `${provider}${model} → ESCO; ${verdict}`;
    }
    return `Offline fuzzy match → ESCO; ${verdict}`;
  }

  function saveAndContinue() {
    const level = educationLevels.find((l) => l.id === educationLevelId);
    const skills: VerifiedSkill[] = extractedSkills.map((s, i) => {
      const draft = reviewedDrafts[i];
      const years = s.yearsExperience ?? (Number(draft?.years) || undefined);
      const confirmed = !!confirmedFlags[i];
      return {
        userText: s.userText,
        yearsExperience: years,
        proficiency: draft?.proficiency as VerifiedSkill["proficiency"],
        esco: s.escoUri
          ? {
              uri: s.escoUri,
              label: s.label,
              localLabel: s.label,
              type: "skill",
            }
          : undefined,
        mappingConfidence: s.confidence,
        userConfirmed: confirmed,
        source: buildSourceString(confirmed),
      };
    });

    const existing = loadProfile(countryId);
    const profile: SkillsProfile = {
      version: "1",
      id: existing?.id ?? newProfileId(),
      sourceCountryId: countryId,
      sourceLocale: locale,
      // Origin is sticky: keep an existing origin if there is one,
      // otherwise this profile is being issued in `countryId`.
      originCountryId: existing?.originCountryId ?? countryId,
      credentials: level
        ? [
            {
              localName: credentialName || level.label,
              iscedLevel: level.iscedEquivalent,
              countryId,
            },
          ]
        : [],
      languages: languages.map((l) => ({
        code: l.code,
        level: l.level,
        isPrimary: l.code === locale,
      })),
      skills,
      meta: {
        createdAt: existing?.meta.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    saveProfile(profile);
    router.push(`/${countryId.toLowerCase()}/profile`);
  }

  return (
    <div>
      <Stepper current={step} dict={dict} />

      <div className="mt-8">
        {step === "education" && (
          <EducationStep
            options={educationLevels}
            value={educationLevelId}
            onChange={setEducationLevelId}
            credentialName={credentialName}
            onCredentialChange={setCredentialName}
            dict={dict}
          />
        )}
        {step === "languages" && (
          <LanguagesStep
            languages={languages}
            onChange={setLanguages}
            dict={dict}
          />
        )}
        {step === "experience" && (
          <ExperienceStep
            experiences={experiences}
            onChange={setExperiences}
            dict={dict}
          />
        )}
        {step === "review" && (
          <ReviewStep
            extracting={extracting}
            extractedSkills={extractedSkills}
            confirmedFlags={confirmedFlags}
            onConfirmToggle={(i, v) =>
              setConfirmedFlags({ ...confirmedFlags, [i]: v })
            }
            dict={dict}
          />
        )}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-stone-200 pt-6">
        <button
          type="button"
          onClick={back}
          disabled={step === "education"}
          className="text-sm text-stone-600 hover:text-stone-900 disabled:opacity-30"
        >
          ← {dict.intake.back}
        </button>

        {step === "experience" ? (
          <button
            type="button"
            onClick={async () => {
              await runExtraction();
              setStep("review");
            }}
            disabled={extracting}
            className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
          >
            {extracting ? dict.intake.analyzing : dict.intake.next} →
          </button>
        ) : step === "review" ? (
          <button
            type="button"
            onClick={saveAndContinue}
            className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            {dict.intake.buildProfile} →
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={next}
              disabled={step === "education" && !educationLevelId}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {dict.intake.next} →
            </button>
            {step === "education" && !educationLevelId && (
              <p className="text-[11px] text-stone-500">
                Pick one of the options above to continue.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ current, dict }: { current: Step; dict: CommonDict }) {
  const labels: Record<Step, string> = {
    education: dict.intake.stepEducation,
    languages: dict.intake.stepLanguages,
    experience: dict.intake.stepExperience,
    review: dict.intake.stepReview,
  };
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((s, i) => {
        const active = s === current;
        const done = STEPS.indexOf(current) > i;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-semibold",
                active && "bg-[var(--color-accent)] text-white",
                done && "bg-stone-900 text-white",
                !active && !done && "bg-stone-200 text-stone-500",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "uppercase tracking-wider",
                active ? "text-stone-900 font-medium" : "text-stone-500",
              )}
            >
              {labels[s]}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-stone-300 mx-1">/</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function EducationStep({
  options,
  value,
  onChange,
  credentialName,
  onCredentialChange,
  dict,
}: {
  options: EducationOption[];
  value: string;
  onChange: (v: string) => void;
  credentialName: string;
  onCredentialChange: (v: string) => void;
  dict: CommonDict;
}) {
  return (
    <div>
      <label className="block text-base font-medium text-stone-900">
        {dict.intake.educationPrompt}
      </label>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative rounded-md border-2 p-3 pr-9 text-left text-sm transition-colors cursor-pointer",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-stone-900 shadow-sm"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
              )}
            >
              <div className="font-medium">{o.label}</div>
              <div className="mt-1 text-[11px] text-stone-500 font-mono">
                ISCED {o.iscedEquivalent}
              </div>
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 inline-flex w-5 h-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-[11px] font-bold leading-none"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <label className="mt-6 block text-sm font-medium text-stone-900">
        {dict.intake.credentialPrompt}
      </label>
      <input
        type="text"
        value={credentialName}
        onChange={(e) => onCredentialChange(e.target.value)}
        placeholder={dict.intake.credentialPlaceholder}
        className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
      />
    </div>
  );
}

function LanguagesStep({
  languages,
  onChange,
  dict,
}: {
  languages: LanguageDraft[];
  onChange: (l: LanguageDraft[]) => void;
  dict: CommonDict;
}) {
  function update(i: number, patch: Partial<LanguageDraft>) {
    onChange(languages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(languages.filter((_, idx) => idx !== i));
  }

  const cefrOptions: LanguageDraft["level"][] = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "native",
  ];

  return (
    <div>
      <label className="block text-base font-medium text-stone-900">
        {dict.intake.languagesPrompt}
      </label>
      <div className="mt-3 space-y-3">
        {languages.map((l, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
          >
            <input
              type="text"
              value={l.code}
              onChange={(e) => update(i, { code: e.target.value })}
              placeholder="en, es, bn, tw, …"
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none font-mono"
            />
            <select
              value={l.level}
              onChange={(e) =>
                update(i, { level: e.target.value as LanguageDraft["level"] })
              }
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              {cefrOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-sm text-stone-400 hover:text-stone-700 px-2"
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...languages, { code: "", level: "B1" }])}
        className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
      >
        + {dict.intake.addLanguage}
      </button>
    </div>
  );
}

function ExperienceStep({
  experiences,
  onChange,
  dict,
}: {
  experiences: ExperienceDraft[];
  onChange: (e: ExperienceDraft[]) => void;
  dict: CommonDict;
}) {
  function update(i: number, patch: Partial<ExperienceDraft>) {
    onChange(experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function remove(i: number) {
    onChange(experiences.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      <label className="block text-base font-medium text-stone-900">
        {dict.intake.experiencePrompt}
      </label>
      <div className="mt-3 space-y-4">
        {experiences.map((e, i) => (
          <div
            key={i}
            className="rounded-md border border-stone-200 bg-white p-3"
          >
            <textarea
              value={e.text}
              onChange={(ev) => update(i, { text: ev.target.value })}
              placeholder={dict.intake.experiencePlaceholder}
              rows={2}
              className="w-full text-sm focus:outline-none resize-none"
            />
            <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
              <label className="flex items-center gap-1">
                <span>{dict.intake.yearsLabel}</span>
                <input
                  type="number"
                  min={0}
                  value={e.years ?? ""}
                  onChange={(ev) => update(i, { years: ev.target.value })}
                  className="w-16 rounded border border-stone-300 px-2 py-0.5 text-xs"
                />
              </label>
              <label className="flex items-center gap-1">
                <span>{dict.intake.proficiencyLabel}</span>
                <select
                  value={e.proficiency ?? ""}
                  onChange={(ev) =>
                    update(i, {
                      proficiency: ev.target.value
                        ? Number(ev.target.value)
                        : undefined,
                    })
                  }
                  className="rounded border border-stone-300 px-1 py-0.5 text-xs"
                >
                  <option value="">—</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto text-stone-400 hover:text-stone-700"
              >
                {dict.profile.remove}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...experiences, { text: "" }])}
        className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
      >
        + {dict.intake.addExperience}
      </button>
    </div>
  );
}

function ReviewStep({
  extracting,
  extractedSkills,
  confirmedFlags,
  onConfirmToggle,
  dict,
}: {
  extracting: boolean;
  extractedSkills: ExtractedSkill[];
  confirmedFlags: Record<number, boolean>;
  onConfirmToggle: (i: number, v: boolean) => void;
  dict: CommonDict;
}) {
  if (extracting) {
    return (
      <p className="text-sm text-stone-500 italic animate-pulse">
        {dict.intake.analyzing}
      </p>
    );
  }
  if (extractedSkills.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        {dict.profile.noProfile}.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {extractedSkills.map((s, i) => {
        const confirmed = confirmedFlags[i] ?? false;
        const conf = Math.round(s.confidence * 100);
        return (
          <li
            key={i}
            className="rounded-md border border-stone-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wider text-stone-500">
              {dict.profile.yourWords}
            </p>
            <p className="mt-1 text-sm text-stone-900">{s.userText}</p>

            <p className="mt-3 text-xs uppercase tracking-wider text-stone-500">
              {dict.profile.weHeard}
            </p>
            <p className="mt-1 text-sm text-stone-900 font-medium">
              {s.label || "—"}
              {s.escoUri && (
                <span className="ml-2 text-[10px] font-mono text-stone-400">
                  {s.escoUri}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-stone-500 italic">{s.reasoning}</p>

            <div className="mt-3 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-mono",
                  conf >= 70
                    ? "text-[var(--color-good)]"
                    : conf >= 40
                      ? "text-stone-600"
                      : "text-[var(--color-warn)]",
                )}
              >
                {conf}% {dict.profile.confidence}
              </span>
              <label className="text-xs flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => onConfirmToggle(i, e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                <span>{dict.profile.confirm}</span>
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
