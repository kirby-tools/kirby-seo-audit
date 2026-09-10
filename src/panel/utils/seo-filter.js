import {
  YOAST_ASSESSMENTS_LOCALE_COMPATIBILITY_MAP,
  YOAST_IGNORED_ASSESSMENTS,
  YOAST_KEYPHRASE_ASSESSMENTS,
} from "../constants";
import { IncompatibleLocaleError } from "./error";

/**
 * Flattens the worker's envelope, where SEO results sit under an empty
 * keyphrase key and readability results directly under their category.
 */
export function flattenYoastSeoResults(rawResult) {
  return [
    ...rawResult.seo[""].results.map((i) => ({ ...i, _category: "seo" })),
    ...rawResult.readability.results.map((i) => ({
      ...i,
      _category: "readability",
    })),
  ];
}

/**
 * @throws {IncompatibleLocaleError} When a selected assessment cannot score the document's locale
 */
export function filterYoastSeoResults(analysisResults, options, locale) {
  const resultsByCategory = {
    seo: [],
    readability: [],
  };

  for (const result of analysisResults) {
    if (!result.text) continue;

    const id = result._identifier.toLowerCase();

    if (YOAST_IGNORED_ASSESSMENTS.some((key) => key.toLowerCase() === id))
      continue;

    // Without a keyphrase, every `YOAST_KEYPHRASE_ASSESSMENTS` entry can only
    // fail, so they stay out unless the blueprint asks for them by name.
    if (
      !options.keyword &&
      options.assessments.length === 0 &&
      YOAST_KEYPHRASE_ASSESSMENTS.some((key) => key.toLowerCase() === id)
    )
      continue;

    if (options.assessments.length > 0) {
      if (!isNamedByAssessments(result, options.assessments)) continue;

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

/**
 * Checks whether `assessments` names the result's assessment. Yoast replaces
 * the result of an assessment that throws with a fresh one that carries no
 * identifier, so an errored result is matched by the words of its text.
 */
function isNamedByAssessments(result, assessments) {
  const id = result._identifier.toLowerCase();
  if (id) return assessments.includes(id);
  if (result.score !== -1) return false;

  const words = result.text.toLowerCase().match(/\w+/g) ?? [];
  return words.some((word) => assessments.includes(word));
}

export function groupResultsByRating(results) {
  const resultsByRating = {
    good: [],
    ok: [],
    bad: [],
    feedback: [],
    error: [],
  };

  for (const result of results) {
    // An empty rating, which `scoreToRating` returns for a missing score,
    // counts as an error rather than breaking the report.
    const rating = Object.hasOwn(resultsByRating, result.rating)
      ? result.rating
      : "error";
    resultsByRating[rating].push({ ...result, rating });
  }

  return Object.fromEntries(
    Object.entries(resultsByRating).filter(([, items]) => items.length > 0),
  );
}

export function scoreToRating(score) {
  if (score === -1) return "error";
  if (score === 0) return "feedback";
  if (score <= 4) return "bad";
  if (score <= 7) return "ok";
  if (score > 7) return "good";
  return "";
}
