import { parseArgs } from "node:util";
import { $, fs } from "zx";
import { YOASTSEO_TAG } from "./yoastseo.mjs";

const { positionals } = parseArgs({ allowPositionals: true });
const tag = positionals[0] ?? YOASTSEO_TAG;

const targetDir = "./src/assets/yoastseo-repo";
const repoUrl = "git@github.com:Yoast/wordpress-seo.git";

await fs.remove(targetDir);

console.log(`Cloning wordpress-seo (tag ${tag}) with depth 1…`);
await $`git clone --depth 1 --branch ${tag} ${repoUrl} ${targetDir}`;
