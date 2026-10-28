import type {
  AuditLabels,
  Category,
  CategoryRating,
  ContentVersion,
  Report,
  ResultRating,
} from "../types";
import { CATEGORIES } from "../constants";

const RATINGS: (ResultRating | CategoryRating)[] = [
  "good",
  "ok",
  "bad",
  "feedback",
  "error",
  "none",
];
const VERSIONS: ContentVersion[] = ["latest", "changes"];

/**
 * Renders the audit labels through `t`, so a host outside the Panel can
 * resolve the plugin's translation keys from its own copy.
 */
export function createAuditLabels(
  t: (key: string) => string,
  locale: string,
): AuditLabels {
  const prefix = "johannschopplich.seo-audit";

  return {
    analyze: t(`${prefix}.analyze`),
    results: {
      all: t(`${prefix}.results`),
      seo: t(`${prefix}.results.seo`),
      readability: t(`${prefix}.results.readability`),
    },
    categories: Object.fromEntries(
      CATEGORIES.map((category) => [
        category,
        t(`${prefix}.category.${category}`),
      ]),
    ) as Record<Category, string>,
    ratings: Object.fromEntries(
      RATINGS.map((rating) => [rating, t(`${prefix}.rating.${rating}`)]),
    ) as AuditLabels["ratings"],
    versions: Object.fromEntries(
      VERSIONS.map((version) => [version, t(`${prefix}.version.${version}`)]),
    ) as AuditLabels["versions"],
    stale: t(`${prefix}.rating.stale`),
    issues: t(`${prefix}.issues`),
    locale,
  };
}

export function reportHeading(results: Report["results"], labels: AuditLabels) {
  if (results.seo.length > 0 && results.readability.length > 0) {
    return labels.results.all;
  }

  return results.seo.length > 0
    ? labels.results.seo
    : labels.results.readability;
}

export function formatReportMeta(
  {
    version,
    timestamp,
    isStale,
  }: Pick<Report, "version" | "timestamp"> & { isStale?: boolean },
  labels: AuditLabels,
) {
  const { format } = new Intl.DateTimeFormat(labels.locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    version && labels.versions[version],
    format(timestamp),
    isStale && labels.stale,
  ]
    .filter(Boolean)
    .join(" · ");
}
