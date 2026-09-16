import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export const YOASTSEO_TAG = "28.5";

export const YOASTSEO_DIR = path.resolve(
  import.meta.dirname,
  "../src/assets/yoastseo-repo",
);

export const YOASTSEO_SRC_DIR = path.join(
  YOASTSEO_DIR,
  "packages/yoastseo/src",
);

export function assertYoastseoCheckout() {
  let tag;

  if (fs.existsSync(YOASTSEO_DIR)) {
    try {
      tag = execFileSync("git", ["-C", YOASTSEO_DIR, "describe", "--tags"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      tag = undefined;
    }
  }

  if (tag === YOASTSEO_TAG) return;

  throw new Error(
    `Expected the wordpress-seo checkout at ${YOASTSEO_DIR} to be at tag ${YOASTSEO_TAG}, found ${tag ?? "no checkout"}. Run \`pnpm prepare:yoastseo\` in the plugin root.`,
  );
}
