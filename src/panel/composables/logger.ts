import type { Logger } from "kirbyuse";
import { createLogger } from "kirbyuse";

let instance: Logger | undefined;

export function useLogger() {
  return (instance ??= createLogger("seo-audit"));
}
