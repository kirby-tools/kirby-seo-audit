import process from "node:process";
import { parseArgs } from "node:util";
import { $, fs } from "zx";

const { positionals } = parseArgs({ allowPositionals: true });
const tag = positionals[0];

if (!tag) {
  console.error("Usage: node scripts/prepare-yoastseo.mjs <tag>");
  process.exit(1);
}

const targetDir = "./src/assets/yoastseo-repo";
const repoUrl = "git@github.com:Yoast/wordpress-seo.git";

await fs.remove(targetDir);

console.log(`Cloning wordpress-seo (tag ${tag}) with depth 1…`);
await $`git clone --depth 1 --branch ${tag} ${repoUrl} ${targetDir}`;
