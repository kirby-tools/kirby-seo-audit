import { AUTO_TRIGGERS } from "../constants";

/**
 * Resolves the `auto` option: the blueprint value wins over the global one,
 * and anything but a known trigger switches the automatic run off.
 */
export function resolveAuto(value: unknown, fallback: unknown) {
  const auto = value ?? fallback;

  return AUTO_TRIGGERS.find((trigger) => trigger === auto);
}
