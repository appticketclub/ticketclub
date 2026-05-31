import { headers } from "next/headers";
import { cookie } from "next/headers";
import { negotiate } from "@formatjs/intl-localematcher";
import type { Locale } from "./routing";

const publicEnv = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
const DEFAULT_LOCALE = publicEnv as Locale;

export function getLocale(locales: readonly Locale[]): Locale {
  const acceptLanguage = headers().get("accept-language");
  const cookies = cookie();
  const localeCookie = cookies.get("NEXT_LOCALE")?.value as Locale | undefined;

  const detectedLocale = negotiate(
    [localeCookie].filter(Boolean) as string[],
    locales as string[],
    DEFAULT_LOCALE
  ) as Locale;

  return detectedLocale;
}
