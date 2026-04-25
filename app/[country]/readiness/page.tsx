import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
  format,
} from "@/packages/core/i18n";
import { ReadinessView } from "./readiness-view";

export default async function ReadinessPage(
  props: PageProps<"/[country]/readiness">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();
  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");

  const countryName = tr(ctx.displayName, userLocale);
  const subtitle = format(dict.readiness.subtitle, { country: countryName });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {countryName} · 02 AI Readiness Lens
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
        {dict.readiness.title}
      </h1>
      <p className="mt-2 text-sm sm:text-base text-stone-600">{subtitle}</p>

      <ReadinessView countryId={ctx.id} countryName={countryName} dict={dict} />
    </div>
  );
}
