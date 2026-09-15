import type { PanelRequestOptions } from "kirby-types";

export function createLanguageRequestOptions(
  language?: string | null,
): PanelRequestOptions {
  return language ? { headers: { "x-language": language } } : {};
}
