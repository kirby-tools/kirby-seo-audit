import { ANALYZE_ON_TRIGGERS } from "../constants";

export function resolveAnalyzeOn(value: unknown, fallback: unknown) {
  const analyzeOn = value ?? fallback;

  return ANALYZE_ON_TRIGGERS.find((trigger) => trigger === analyzeOn);
}
