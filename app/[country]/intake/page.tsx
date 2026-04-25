import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
} from "@/packages/core/i18n";
import { IntakeForm } from "./intake-form";

export default async function IntakePage(
  props: PageProps<"/[country]/intake">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();

  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");

  // Localize education levels for the form (uses UI locale, with English fallback)
  const levels = ctx.educationTaxonomy.levels.map((l) => ({
    id: l.id,
    label: tr(l.label, userLocale),
    iscedEquivalent: l.iscedEquivalent,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {tr(ctx.displayName, userLocale)} · 01 Skills Signal Engine
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
        {dict.intake.title}
      </h1>
      <p className="mt-2 text-sm sm:text-base text-stone-600">
        {dict.intake.subtitle}
      </p>

      <div className="mt-8">
        <IntakeForm
          countryId={ctx.id}
          locale={userLocale}
          educationLevels={levels}
          dict={dict}
        />
      </div>
    </div>
  );
}
