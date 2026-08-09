import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown/config";
import { defineEnv } from "unenv";
import { YOASTSEO_TAG } from "../../scripts/yoastseo.mjs";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(currentDir, "../..");
const yoastseoDir = path.resolve(currentDir, "yoastseo-repo");

assertYoastseoCheckout();

const entries = fs
  .readdirSync(currentDir)
  .filter((file) => file.endsWith(".js") && !file.endsWith(".config.js"));

const { env } = defineEnv({ nodeCompat: true });

export default defineConfig(
  entries.map((entry) => ({
    entry,
    alias: {
      ...env.alias,
      yoastseo: path.resolve(
        currentDir,
        "yoastseo-repo/packages/yoastseo/src/index.js",
      ),
    },
    outDir: `${rootDir}/assets`,
    outputOptions: {
      codeSplitting: false,
    },
    platform: "browser",
    // Inline external dependencies.
    noExternal: [/.*/],
    inlineOnly: false,
    minify: true,
  })),
);

function assertYoastseoCheckout() {
  let tag;

  if (fs.existsSync(yoastseoDir)) {
    try {
      tag = execFileSync("git", ["-C", yoastseoDir, "describe", "--tags"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      tag = undefined;
    }
  }

  if (tag === YOASTSEO_TAG) return;

  throw new Error(
    `Expected the wordpress-seo checkout at ${yoastseoDir} to be at tag ${YOASTSEO_TAG}, found ${tag ?? "no checkout"}. Run \`pnpm prepare:yoastseo\` in the plugin root.`,
  );
}
