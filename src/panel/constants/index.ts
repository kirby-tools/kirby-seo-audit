export * from "./yoast";

export const PLUGIN_CONTEXT_API_ROUTE = "__seo-audit__/context";
export const PLUGIN_BUTTON_OPTIONS_API_ROUTE = "__seo-audit__/button-options";
export const PLUGIN_PREVIEW_URL_API_ROUTE = "__seo-audit__/preview-url";
export const PLUGIN_RATING_API_ROUTE = "__seo-audit__/rating";
export const PLUGIN_PROXY_API_ROUTE = "__seo-audit__/proxy";

export const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export const DEFAULT_LOG_LEVEL: LogLevel = "warn";
export const STORAGE_KEY_PREFIX = "kirby$seo-audit$";
export const CATEGORIES = ["seo", "readability"] as const;
export const AUTO_TRIGGERS = ["publish"] as const;
export type AutoTrigger = (typeof AUTO_TRIGGERS)[number];
