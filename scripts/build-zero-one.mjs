import { $, fs } from "zx";

const { version } = await fs.readJson("./package.json");
const distDir = "./dist-zero-one";
const zipName = `kirby-seo-audit-zero-one-${version}.zip`;

await fs.remove(distDir);
await fs.ensureDir(distDir);

// `export-ignore` in `.gitattributes` decides what the archive carries.
await $`git archive --format=tar --prefix=kirby-seo-audit/ HEAD | tar -x -C ${distDir}`;

await fs.copy("./zero-one", `${distDir}/kirby-seo-audit`, { overwrite: true });

// Update composer.json (remove licensing dependency).
const composer = await fs.readJson(`${distDir}/kirby-seo-audit/composer.json`);
delete composer.require;
await fs.writeJson(`${distDir}/kirby-seo-audit/composer.json`, composer, {
  spaces: 2,
});
await fs.remove(`${distDir}/kirby-seo-audit/composer.lock`);
await fs.remove(`${distDir}/kirby-seo-audit/vendor`);

// This edition ships without Composer dependencies, but the plugin's own
// classes are still PSR-4 autoloaded, so the autoloader has to be rebuilt.
await $`composer dump-autoload --optimize --no-interaction --working-dir=${distDir}/kirby-seo-audit`;

await fs.copy("./index.js", `${distDir}/kirby-seo-audit/index.js`);
await fs.copy("./index.css", `${distDir}/kirby-seo-audit/index.css`);
await fs.copy("./assets", `${distDir}/kirby-seo-audit/assets`);

await $`cd ${distDir} && zip -r ../${zipName} kirby-seo-audit`;

await fs.remove(distDir);

console.log(`✓ Created: ${zipName}`);
