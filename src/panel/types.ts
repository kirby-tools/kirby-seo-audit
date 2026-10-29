import type { PluginContext } from "@kirby-tools/licensing";
import type { AnalyzeOnTrigger, CATEGORIES, LogLevel } from "./constants";

export type Category = (typeof CATEGORIES)[number];
export type ContentVersion = "latest" | "changes";

export type TrafficLight = "good" | "ok" | "bad";
/** A result's light; `feedback` has nothing to judge, `error` a failed assessment. */
export type ResultRating = TrafficLight | "feedback" | "error";
/** A category's light; `none` when it could not be scored. */
export type CategoryRating = TrafficLight | "none";

export interface AssessmentContext {
  htmlDocument: Document;
  contentSelector: string;
}

export interface AssessmentResult {
  score: number;
  /** The message key under the assessment's key. */
  translation: string;
  context?: Record<string, unknown>;
  details?: { text: string };
}

export type Assessment = (context: AssessmentContext) => AssessmentResult;

export interface Result {
  score: number;
  /** Empty for a result without a score, which the report groups under `error`. */
  rating: ResultRating | "";
  text: string;
  details?: { text: string };
}

export interface YoastResult {
  _identifier: string;
  /** Set by the plugin from the category the result arrived in. */
  _category: Category;
  score: number;
  text: string;
}

export interface CategoryScore {
  score: number;
  rating: CategoryRating;
}

export interface Report {
  results: Record<Category, Result[]>;
  /** A category without results has no score. */
  ratings: Record<Category, CategoryScore | undefined>;
  version?: ContentVersion;
  timestamp: number;
}

export interface ReportStorageScope {
  path: string;
  /** `null` on single-language sites. */
  language: string | null;
  field: string;
}

/** The fixed strings the audit components show, translated by the caller. */
export interface AuditLabels {
  analyze: string;
  /** Report headings by the categories that have results; `all` when both have. */
  results: Record<Category | "all", string>;
  categories: Record<Category, string>;
  ratings: Record<ResultRating | CategoryRating, string>;
  versions: Record<ContentVersion, string>;
  stale: string;
  issues: string;
  /** The locale the report timestamp is formatted in. */
  locale: string;
}

export interface AnalysisOptions {
  assessments: string[];
  /** Index into `LOG_LEVELS`. */
  logLevel: number;
  /** Option names expected by Yoast SEO. */
  keyword: string;
  synonyms: string[];
}

export interface YoastAnalysisOptions extends AnalysisOptions {
  url: string;
  title: string;
  description: string;
  /** The document locale, not the Panel language. */
  language: string;
}

export interface RatingRecord {
  seo: CategoryRating | null;
  readability: CategoryRating | null;
  counts: Record<TrafficLight, number>;
  version?: ContentVersion | null;
}

/**
 * `version` and `timestamp` are `null` before the first analysis; a run the
 * Panel keeps before the server answers has the same shape.
 */
export interface Rating extends RatingRecord {
  timestamp: number | null;
  isStale: boolean;
}

/** Only the playground passes a bare URL with no model behind it. */
export interface PreviewTarget {
  url: string;
  path?: string;
  language?: string | null;
  version?: ContentVersion;
}

export interface PluginConfig {
  analyzeOn?: AnalyzeOnTrigger | false | null;
  logLevel?: LogLevel | null;
}

export interface PluginContextResponse extends PluginContext {
  config: PluginConfig;
}

export interface ButtonOptionsResponse {
  keyphrase?: string | null;
  synonyms?: string | string[] | null;
}

export interface PreviewUrlResponse {
  /** `null` for a model without a preview URL for the current user. */
  url: string | null;
  version: ContentVersion;
}

export type ProxyResponse =
  | { code: number; html: string; url: string }
  /** The host could not be reached. */
  | { code: null; html: null; url: string };
