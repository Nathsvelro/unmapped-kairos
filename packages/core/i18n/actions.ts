"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SUPPORTED_LOCALES } from "./dictionary";
import { LOCALE_COOKIE } from "./userLocale";
import type { LocaleId } from "../types";

export async function setUserLocale(locale: string, currentPath: string) {
  if (!SUPPORTED_LOCALES.includes(locale as LocaleId)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(currentPath);
  revalidatePath("/");
}
