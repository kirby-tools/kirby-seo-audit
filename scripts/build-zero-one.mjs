import process from "node:process";
import { $, fs } from "zx";

const { version } = await fs.readJson("./package.json");
const distDir = "./dist-zero-one";
const zipName = `kirby-seo-audit-zero-one-${version}.zip`;

await fs.remove(distDir);
await fs.ensureDir(distDir);

// `export-ignore` in `.gitattributes` decides what the archive carries.
await $`git archive --format=tar --prefix=kirby-seo-audit/ HEAD | tar -x -C ${distDir}`;

await fs.copy("./zero-one", `${distDir}/kirby-seo-audit`, { overwrite: true });

// The plugin's own classes are still PSR-4 autoloaded. `composer install`
// rebuilds the autoloader together with the `InstalledVersions` class its
// class map points to, which `dump-autoload` leaves out.
const composer = await fs.readJson(`${distDir}/kirby-seo-audit/composer.json`);
delete composer.require;
delete composer["require-dev"];
await fs.writeJson(`${distDir}/kirby-seo-audit/composer.json`, composer, {
  spaces: 2,
});
await fs.remove(`${distDir}/kirby-seo-audit/vendor`);
await $`composer install --no-dev --no-interaction --working-dir=${distDir}/kirby-seo-audit`;
await fs.remove(`${distDir}/kirby-seo-audit/composer.lock`);

// The tracked `index.js` stays the main edition's.
await $({
  env: { ...process.env, ZERO_ONE: "true" },
})`kirbyup src/panel/index.ts --out-dir ${distDir}/kirby-seo-audit`;

await $`cd ${distDir} && zip -r ../${zipName} kirby-seo-audit`;

await fs.remove(distDir);

console.log(`✓ Created: ${zipName}`);
