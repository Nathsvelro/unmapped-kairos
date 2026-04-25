"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { CountryId } from "@/packages/core/types";

const ORDER: CountryId[] = ["GH", "BD", "MX", "BR"];

/**
 * D1 country switcher — the chip strip in the header (GH | BD | MX | BR).
 * Clicking a chip navigates to the same path under the new country, so the
 * current page (intake / profile / readiness / opportunities / dashboard)
 * is preserved while locale / currency / taxonomy / α-β all flip.
 */
export function CountrySwitcherChips({ current }: { current: CountryId }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [pending, startTransition] = useTransition();

  function pick(id: CountryId) {
    if (id === current) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      startTransition(() => router.push(`/${id.toLowerCase()}`));
      return;
    }
    segments[0] = id.toLowerCase();
    startTransition(() => router.push("/" + segments.join("/")));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Country context"
      className="mono"
      style={{
        display: "inline-flex",
        border: "1px solid rgba(182, 212, 216, 0.35)",
        borderRadius: 4,
        overflow: "hidden",
        fontSize: 11,
        letterSpacing: ".06em",
      }}
    >
      {ORDER.map((id, i) => {
        const active = id === current;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(id)}
            disabled={pending && active}
            style={{
              padding: "5px 11px",
              background: active ? "var(--color-coral)" : "transparent",
              color: active ? "#fff" : "var(--color-teal-200)",
              border: "none",
              borderLeft:
                i === 0 ? "none" : "1px solid rgba(182, 212, 216, 0.35)",
              cursor: active ? "default" : "pointer",
              fontFamily: "inherit",
              fontWeight: active ? 600 : 400,
            }}
          >
            {id}
          </button>
        );
      })}
    </div>
  );
}
