import * as fsp from "node:fs/promises";
import { parseArgs } from "node:util";
import { x } from "tinyexec";
import { YOASTSEO_TAG } from "./yoastseo.mjs";

const { positionals } = parseArgs({ allowPositionals: true });
const tag = positionals[0] ?? YOASTSEO_TAG;

const targetDir = "src/assets/yoastseo-repo";
const repoUrl = "git@github.com:Yoast/wordpress-seo.git";

await fsp.rm(targetDir, { recursive: true, force: true });

console.log(`Cloning wordpress-seo (tag ${tag}) with depth 1…`);
await x("git", ["clone", "--depth", "1", "--branch", tag, repoUrl, targetDir], {
  throwOnError: true,
  nodeOptions: { stdio: "inherit" },
});
