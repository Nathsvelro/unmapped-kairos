import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
  format,
} from "@/packages/core/i18n";
import { OpportunitiesView } from "./opportunities-view";

export default async function OpportunitiesPage(
  props: PageProps<"/[country]/opportunities">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();
  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");

  const countryName = tr(ctx.displayName, userLocale);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {countryName} · 03 Opportunity Matching
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
        {dict.opportunities.title}
      </h1>
      <p className="mt-2 text-sm sm:text-base text-stone-600">
        {format(dict.opportunities.subtitle, { country: countryName })}
      </p>

      <OpportunitiesView
        countryId={ctx.id}
        currency={ctx.laborMarket.currency}
        locale={userLocale}
        opportunityTypes={ctx.opportunityTypes}
        dict={dict}
      />
    </div>
  );
}
