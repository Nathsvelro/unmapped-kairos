"use client";

import { useState } from "react";
import { seedAllDemoProfiles } from "./profileStorage";
import type { CountryId } from "@/packages/core/types";

const PERSONAS: Record<CountryId, string> = {
  GH: "Amara, 22 — phone repair since 17, self-taught coding (the brief's persona)",
  BD: "Rina — garments worker, informal admin",
  MX: "Diego — vehicle mechanic, self-taught coding",
  BR: "Júlia — junior web developer + freelance",
};

export function SeedDemoButton() {
  const [seeded, setSeeded] = useState<CountryId[] | null>(null);

  function run() {
    const ids = seedAllDemoProfiles();
    setSeeded(ids);
  }

  return (
    <div className="mt-8 rounded-md border border-[var(--color-accent)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900">
            Just exploring? Seed all four demo profiles
          </p>
          <p className="mt-1 text-xs text-stone-600 leading-relaxed">
            Loads a country-appropriate persona into each country so the Profile,
            Readiness, Opportunities, and Dashboard tabs all light up immediately —
            no need to type through the intake form. Saved only in your browser.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          className="shrink-0 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          {seeded ? "Re-seed" : "Seed demo profiles"}
        </button>
      </div>

      {seeded && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {seeded.map((id) => (
            <li
              key={id}
              className="rounded border border-stone-200 bg-stone-50 px-3 py-2 flex items-center justify-between gap-2"
            >
              <span className="text-stone-700">
                <span className="font-mono text-[10px] text-stone-500 mr-1">
                  {id}
                </span>
                {PERSONAS[id]}
              </span>
              <a
                href={`/${id.toLowerCase()}/profile`}
                className="font-medium text-[var(--color-accent)] hover:underline shrink-0"
              >
                Open →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
