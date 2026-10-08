import type { PanelApiRequestOptions } from "kirby-types";

export function createLanguageRequestOptions(
  language?: string | null,
): PanelApiRequestOptions {
  return language ? { headers: { "x-language": language } } : {};
}
