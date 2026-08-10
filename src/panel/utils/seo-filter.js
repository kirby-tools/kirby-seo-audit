import {
  YOAST_ASSESSMENTS_LOCALE_COMPATIBILITY_MAP,
  YOAST_IGNORED_ASSESSMENTS,
  YOAST_KEYPHRASE_ASSESSMENTS,
} from "../constants";
import { IncompatibleLocaleError } from "./error";

/**
 * @throws {IncompatibleLocaleError} When a selected assessment cannot score the document's locale
 */
export function filterYoastSeoResults(rawResult, options, locale) {
  const analysisResults = [
    ...rawResult.seo[""].results.map((i) => ({ ...i, _category: "seo" })),
    ...rawResult.readability.results.map((i) => ({
      ...i,
      _category: "readability",
    })),
  ];

  const resultsByCategory = {
    seo: [],
    readability: [],
  };

  for (const result of analysisResults) {
    if (!result.text) continue;

    const id = result._identifier.toLowerCase();

    if (YOAST_IGNORED_ASSESSMENTS.some((key) => key.toLowerCase() === id))
      continue;

    // Without a keyphrase these can only fail, so they stay out unless the
    // blueprint asks for them by name.
    if (
      !options.keyword &&
      options.assessments.length === 0 &&
      YOAST_KEYPHRASE_ASSESSMENTS.some((key) => key.toLowerCase() === id)
    )
      continue;

    if (options.assessments.length > 0 && !options.assessments.includes(id))
      continue;

    if (options.assessments.length > 0) {
      const compatibleLocales = Object.entries(
        YOAST_ASSESSMENTS_LOCALE_COMPATIBILITY_MAP,
      ).find(([key]) => key.toLowerCase() === id)?.[1];

      if (compatibleLocales && !compatibleLocales.includes(locale)) {
        throw new IncompatibleLocaleError({
          locale,
          assessment: result._identifier,
          compatibleLocales,
        });
      }
    }

    resultsByCategory[result._category].push({
      ...result,
      rating: scoreToRating(result.score),
    });
  }

  return resultsByCategory;
}

export function scoreToRating(score) {
  if (score === -1) return "error";
  if (score === 0) return "feedback";
  if (score <= 4) return "bad";
  if (score <= 7) return "ok";
  if (score > 7) return "good";
  return "";
}
