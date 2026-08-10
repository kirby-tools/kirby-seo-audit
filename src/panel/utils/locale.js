import { LANGUAGE_TO_LOCALE_MAP } from "../constants";

// Yoast keys its researchers by the codes it ships: `no` and `nn` both have to
// reach the Bokmål researcher.
const LANGUAGE_ALIASES = Object.freeze({
  nn: "nb",
  no: "nb",
});

/**
 * Turns a document's `lang` attribute into a locale Yoast understands. A `lang`
 * without a region, like `de`, expands to a full locale.
 */
export function resolveDocumentLocale(lang) {
  const [subtag = "", ...rest] = (lang || "").split("-");
  const language = subtag.toLowerCase();
  const resolved = LANGUAGE_ALIASES[language] ?? language;

  if (rest.length > 0) {
    return [resolved, ...rest].join("-");
  }

  return LANGUAGE_TO_LOCALE_MAP[resolved] ?? LANGUAGE_TO_LOCALE_MAP.en;
}
