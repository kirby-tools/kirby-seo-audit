import { createLogger } from "kirbyuse";

let instance;

export function useLogger() {
  return (instance ??= createLogger("seo-audit"));
}
