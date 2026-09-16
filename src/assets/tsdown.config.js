import * as fs from "node:fs";
import * as path from "node:path";
import { defineConfig } from "tsdown/config";
import { defineEnv } from "unenv";
import {
  assertYoastseoCheckout,
  YOASTSEO_SRC_DIR,
} from "../../scripts/yoastseo.mjs";

const rootDir = path.resolve(import.meta.dirname, "../..");

assertYoastseoCheckout();

const entries = fs
  .readdirSync(import.meta.dirname)
  .filter((file) => file.endsWith(".js") && !file.endsWith(".config.js"));

const { env } = defineEnv({ nodeCompat: true });

export default defineConfig(
  entries.map((entry) => ({
    entry,
    alias: {
      ...env.alias,
      yoastseo: path.join(YOASTSEO_SRC_DIR, "index.js"),
    },
    outDir: `${rootDir}/assets`,
    outputOptions: {
      codeSplitting: false,
    },
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
    },
    platform: "browser",
    minify: true,
  })),
);
