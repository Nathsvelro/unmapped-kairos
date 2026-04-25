import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
} from "@/packages/core/i18n";
import { CoachView } from "./coach-view";

export default async function CoachPage(
  props: PageProps<"/[country]/coach">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();
  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");
  const countryName = tr(ctx.displayName, userLocale);

  return (
    <div
      className="mx-auto max-w-3xl"
      style={{ padding: "32px 24px 56px" }}
    >
      <p
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--color-teal-700)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          margin: 0,
        }}
      >
        {countryName} · 02 Durability Coach
      </p>
      <h1
        className="display"
        style={{
          fontSize: "clamp(28px, 4vw, 36px)",
          fontWeight: 600,
          color: "var(--color-teal-900)",
          margin: "8px 0 6px",
          lineHeight: 1.2,
        }}
      >
        Make your skills durable
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--color-ink-3)",
          margin: 0,
          maxWidth: 620,
          lineHeight: 1.55,
        }}
      >
        We read your profile and {countryName}&apos;s automation calibration,
        then turn it into concrete steps. Honest about what we know and what we
        can&apos;t verify.
      </p>

      <CoachView countryId={ctx.id} countryName={countryName} dict={dict} />
    </div>
  );
}
