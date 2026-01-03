import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown/config";
import { defineEnv } from "unenv";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(currentDir, "../..");

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
    outExtensions: () => ({ js: ".js" }),
    outputOptions: {
      inlineDynamicImports: true,
    },
    platform: "browser",
    // Inline external dependencies
    noExternal: [/.*/],
    minify: true,
  })),
);
