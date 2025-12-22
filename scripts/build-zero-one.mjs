import { $, fs } from "zx";

const { version } = await fs.readJson("./package.json");
const distDir = "./dist-zero-one";
const zipName = `kirby-seo-audit-zero-one-${version}.zip`;

await fs.remove(distDir);
await fs.ensureDir(distDir);

// Create git archive (respects `.gitattributes` export-ignore) and extract
await $`git archive --format=tar --prefix=kirby-seo-audit/ HEAD | tar -x -C ${distDir}`;

// Copy override files (replaces original files)
await fs.copy("./zero-one", `${distDir}/kirby-seo-audit`, { overwrite: true });

// Update composer.json (remove licensing dependency)
const composer = await fs.readJson(`${distDir}/kirby-seo-audit/composer.json`);
delete composer.require;
await fs.writeJson(`${distDir}/kirby-seo-audit/composer.json`, composer, {
  spaces: 2,
});
await fs.remove(`${distDir}/kirby-seo-audit/composer.lock`);
await fs.remove(`${distDir}/kirby-seo-audit/vendor`);

// Copy build artifacts
await fs.copy("./index.js", `${distDir}/kirby-seo-audit/index.js`);
await fs.copy("./index.css", `${distDir}/kirby-seo-audit/index.css`);
await fs.copy("./assets", `${distDir}/kirby-seo-audit/assets`);

// Create ZIP
await $`cd ${distDir} && zip -r ../${zipName} kirby-seo-audit`;

await fs.remove(distDir);

console.log(`✓ Created: ${zipName}`);
