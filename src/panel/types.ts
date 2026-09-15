import type { LicenseStatus } from "@kirby-tools/licensing";
import type { PluginAsset } from "kirbyuse";
import type { AutoTrigger, LogLevel } from "./constants";

export type Category = "seo" | "readability";
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

/** What one of the plugin's own assessments yields; `translation` names the message under the assessment's key. */
export interface AssessmentResult {
  score: number;
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

/** The fields the plugin reads off a Yoast assessment result, tagged with the category it arrived in. */
export interface YoastResult {
  _identifier: string;
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
  language: string;
  section: string;
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
  version: ContentVersion | undefined;
}

/**
 * Response from the `__seo-audit__/rating` API endpoint. `version` and
 * `timestamp` are `null` before the first analysis; a run the Panel keeps
 * before the server answers has the same shape.
 */
export interface Rating extends Omit<RatingRecord, "version"> {
  version?: ContentVersion | null;
  timestamp: number | null;
  isStale: boolean;
}

/** The preview URL to analyze; the playground passes a bare URL with no model behind it. */
export interface PreviewTarget {
  url: string;
  path?: string;
  language?: string;
  version?: ContentVersion;
}

export interface PluginConfig {
  auto?: AutoTrigger | false | null;
  logLevel?: LogLevel | null;
}

/** Response from the `__seo-audit__/context` API endpoint. */
export interface PluginContextResponse {
  config: PluginConfig;
  assets: PluginAsset[];
  licenseStatus?: LicenseStatus;
}

/** Response from the `__seo-audit__/button-options` API endpoint. */
export interface ButtonOptionsResponse {
  keyphrase?: string | null;
  synonyms?: string | string[] | null;
}

/** Response from the `__seo-audit__/preview-url` API endpoint. */
export interface PreviewUrlResponse {
  /** `null` for a model without a preview URL for the current user. */
  url: string | null;
  version: ContentVersion;
}

/** Response from the `__seo-audit__/proxy` API endpoint. */
export interface ProxyResponse {
  /** `null` when the host could not be reached. */
  code: number | null;
  html: string | null;
  url: string;
}
