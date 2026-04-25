"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setUserLocale } from "@/packages/core/i18n/actions";
import type { LocaleId } from "@/packages/core/types";

const LABELS: Record<LocaleId, string> = {
  en: "EN",
  tw: "TW",
  bn: "BN",
  es: "ES",
  pt: "PT",
};

const FULL_LABELS: Record<LocaleId, string> = {
  en: "English",
  tw: "Twi",
  bn: "বাংলা",
  es: "Español",
  pt: "Português",
};

const ORDER: LocaleId[] = ["en", "tw", "bn", "es", "pt"];

export function LocaleSwitcher({ current }: { current: LocaleId }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function pick(locale: LocaleId) {
    startTransition(async () => {
      await setUserLocale(locale, pathname);
    });
  }

  return (
    <div className="relative inline-block group">
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-stone-300 bg-white text-stone-700 hover:border-stone-400 font-mono"
        aria-label="Change language"
        disabled={pending}
      >
        {LABELS[current]} ▾
      </button>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block bg-white border border-stone-200 rounded shadow-md min-w-[140px] z-20">
        {ORDER.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => pick(l)}
            className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-stone-100 ${
              l === current ? "font-semibold text-[var(--color-accent)]" : "text-stone-700"
            }`}
          >
            <span className="font-mono mr-2">{LABELS[l]}</span>
            {FULL_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
