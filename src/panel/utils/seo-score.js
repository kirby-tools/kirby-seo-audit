import { scoreToRating } from "./seo-filter";

// Yoast scores a category from the results it kept, so the plugin recomputes
// both scores after filtering and mirrors Yoast's `scoreAggregators` here.
const SEO_SCORE_SCALE = 100;
const MAX_RESULT_SCORE = 9;

// A readability penalty weighs a bad result heavier in a language Yoast only
// partially supports.
const READABILITY_PENALTIES = {
  full: { bad: 3, ok: 2, good: 0 },
  partial: { bad: 4, ok: 2, good: 0 },
};
const READABILITY_FULLY_SUPPORTED_LANGUAGES = [
  "en",
  "nl",
  "de",
  "it",
  "ru",
  "fr",
  "es",
];
const READABILITY_SCORES = {
  good: 90,
  ok: 60,
  bad: 30,
  none: 0,
};

const RATING_ORDER = ["bad", "ok", "good"];

/**
 * Rates both categories of a filtered report. A category without results has
 * no rating; a category Yoast cannot score yet rates `none`.
 */
export function rateReport(results, language) {
  return {
    seo: rateCategory(aggregateSeoScore(results.seo), results.seo),
    readability: rateCategory(
      aggregateReadabilityScore(results.readability, language),
      results.readability,
    ),
  };
}

/**
 * Picks the rating an editor has to act on first. `none` gives way to any
 * real rating; without one, the report as a whole is unrated.
 */
export function worstRating(ratings) {
  const ratedLights = Object.values(ratings)
    .filter(Boolean)
    .map((i) => i.rating)
    .filter((rating) => RATING_ORDER.includes(rating));

  if (ratedLights.length === 0) return "none";

  return ratedLights.sort(
    (a, b) => RATING_ORDER.indexOf(a) - RATING_ORDER.indexOf(b),
  )[0];
}

export function aggregateSeoScore(results) {
  const scoredResults = results.filter((result) => result.score !== -1);

  if (scoredResults.length === 0) return 0;

  const sum = scoredResults.reduce((total, result) => total + result.score, 0);

  return (
    Math.round((sum * SEO_SCORE_SCALE) / (scoredResults.length * MAX_RESULT_SCORE)) ||
    0
  );
}

export function aggregateReadabilityScore(results, language) {
  const scoredResults = results.filter((result) => result.score !== -1);

  // Yoast rates a single readability result as no rating at all.
  if (scoredResults.length <= 1) return READABILITY_SCORES.none;

  const isFullySupported =
    READABILITY_FULLY_SUPPORTED_LANGUAGES.includes(language);
  const penalties = isFullySupported
    ? READABILITY_PENALTIES.full
    : READABILITY_PENALTIES.partial;
  const penalty = scoredResults.reduce(
    (total, result) => total + (penalties[scoreToRating(result.score)] ?? 0),
    0,
  );

  if (penalty > (isFullySupported ? 6 : 4)) return READABILITY_SCORES.bad;
  if (penalty > (isFullySupported ? 4 : 2)) return READABILITY_SCORES.ok;

  return READABILITY_SCORES.good;
}

function rateCategory(score, results) {
  if (results.length === 0) return undefined;

  return {
    score,
    // Yoast rates the 0–100 score with the thresholds of a single result.
    rating: score === 0 ? "none" : scoreToRating(score / 10),
  };
}
