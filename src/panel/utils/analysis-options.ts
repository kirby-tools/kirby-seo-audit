import type { LogLevel } from "../constants";
import { DEFAULT_LOG_LEVEL, LOG_LEVELS } from "../constants";

export function resolveKeyphrase(
  content: Record<string, unknown>,
  keyphrase?: string | null,
  keyphraseField?: string | null,
): string {
  const fieldValue = keyphraseField
    ? content[keyphraseField.toLowerCase()]
    : undefined;

  return keyphrase || (typeof fieldValue === "string" ? fieldValue : "");
}

export function resolveSynonyms(
  content: Record<string, unknown>,
  synonyms?: string | string[] | null,
  synonymsField?: string | null,
): string[] {
  const value =
    synonyms ||
    (synonymsField ? content[synonymsField.toLowerCase()] : undefined);

  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((i) => i.trim());

  return [];
}

export function resolveLogLevelIndex(
  logLevel?: LogLevel | null,
  fallback?: LogLevel | null,
) {
  return LOG_LEVELS.indexOf(
    logLevel && LOG_LEVELS.includes(logLevel)
      ? logLevel
      : (fallback ?? DEFAULT_LOG_LEVEL),
  );
}
