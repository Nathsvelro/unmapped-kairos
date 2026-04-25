import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
} from "@/packages/core/i18n";
import { ProfileView } from "./profile-view";

export default async function ProfilePage(
  props: PageProps<"/[country]/profile">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();

  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {tr(ctx.displayName, userLocale)}
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
        {dict.profile.title}
      </h1>
      <p className="mt-2 text-sm sm:text-base text-stone-600">
        {dict.profile.subtitle}
      </p>

      <ProfileView countryId={ctx.id} dict={dict} />
    </div>
  );
}
