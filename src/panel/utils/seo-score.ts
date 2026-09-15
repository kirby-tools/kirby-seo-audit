import type {
  Category,
  CategoryScore,
  ContentVersion,
  RatingRecord,
  Report,
  Result,
  ResultRating,
  TrafficLight,
} from "../types";
import { scoreToRating } from "./seo-filter";

// Yoast scores a category from the results it kept, so the plugin recomputes
// both scores after filtering and mirrors Yoast's `scoreAggregators` here.
const SEO_SCORE_SCALE = 100;
const MAX_RESULT_SCORE = 9;

// A readability penalty weighs a bad result heavier in a language Yoast only
// partially supports.
const READABILITY_PENALTIES: Record<
  "full" | "partial",
  Partial<Record<ResultRating, number>>
> = {
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

const RATING_ORDER: readonly TrafficLight[] = ["bad", "ok", "good"];
const CATEGORIES: Category[] = ["seo", "readability"];

export function rateReport(
  results: Record<Category, Pick<Result, "score">[]>,
  language: string,
): Report["ratings"] {
  return {
    seo: rateCategory(aggregateSeoScore(results.seo), results.seo),
    readability: rateCategory(
      aggregateReadabilityScore(results.readability, language),
      results.readability,
    ),
  };
}

/**
 * Picks the light an editor has to act on first from a rating record. `none`
 * gives way to any real light; without one, the record as a whole is unrated.
 */
export function worstRating(
  record: Pick<RatingRecord, Category>,
): TrafficLight | "none" {
  const ratedLights = CATEGORIES.map((category) => record[category]).filter(
    isTrafficLight,
  );

  if (ratedLights.length === 0) return "none";

  return ratedLights.sort(
    (a, b) => RATING_ORDER.indexOf(a) - RATING_ORDER.indexOf(b),
  )[0]!;
}

export function toRatingRecord(
  {
    results,
    ratings,
  }: {
    results: Record<Category, Pick<Result, "rating">[]>;
    ratings: Report["ratings"];
  },
  version: ContentVersion | undefined,
): RatingRecord {
  const counts = { good: 0, ok: 0, bad: 0 };

  for (const category of CATEGORIES) {
    for (const { rating } of results[category]) {
      if (isTrafficLight(rating)) counts[rating]++;
    }
  }

  return {
    seo: ratings.seo?.rating ?? null,
    readability: ratings.readability?.rating ?? null,
    counts,
    version,
  };
}

export function aggregateSeoScore(results: Pick<Result, "score">[]) {
  const scoredResults = results.filter((result) => result.score !== -1);

  if (scoredResults.length === 0) return 0;

  const sum = scoredResults.reduce((total, result) => total + result.score, 0);

  return (
    Math.round(
      (sum * SEO_SCORE_SCALE) / (scoredResults.length * MAX_RESULT_SCORE),
    ) || 0
  );
}

export function aggregateReadabilityScore(
  results: Pick<Result, "score">[],
  language: string,
) {
  const scoredResults = results.filter((result) => result.score !== -1);

  // Yoast rates a single readability result as no rating at all.
  if (scoredResults.length <= 1) return READABILITY_SCORES.none;

  const isFullySupported =
    READABILITY_FULLY_SUPPORTED_LANGUAGES.includes(language);
  const penalties = isFullySupported
    ? READABILITY_PENALTIES.full
    : READABILITY_PENALTIES.partial;
  const penalty = scoredResults.reduce((total, result) => {
    const rating = scoreToRating(result.score);

    return total + (rating ? (penalties[rating] ?? 0) : 0);
  }, 0);

  if (penalty > (isFullySupported ? 6 : 4)) return READABILITY_SCORES.bad;
  if (penalty > (isFullySupported ? 4 : 2)) return READABILITY_SCORES.ok;

  return READABILITY_SCORES.good;
}

function rateCategory(
  score: number,
  results: Pick<Result, "score">[],
): CategoryScore | undefined {
  if (results.length === 0) return undefined;

  return {
    score,
    // Yoast rates the 0–100 score with the thresholds of a single result. A
    // score past 0 lands on a light, never on `feedback` or `error`.
    rating: score === 0 ? "none" : (scoreToRating(score / 10) as TrafficLight),
  };
}

function isTrafficLight(value: unknown): value is TrafficLight {
  return (RATING_ORDER as readonly unknown[]).includes(value);
}
