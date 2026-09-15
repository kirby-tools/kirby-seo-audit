import { AUTO_TRIGGERS } from "../constants";

export function resolveAuto(value: unknown, fallback: unknown) {
  const auto = value ?? fallback;

  return AUTO_TRIGGERS.find((trigger) => trigger === auto);
}
