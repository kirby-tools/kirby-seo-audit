import * as fsp from "node:fs/promises";
import { x } from "tinyexec";

const { version } = JSON.parse(await fsp.readFile("package.json", "utf8"));
const distDir = "dist-zero-one";
const pluginDir = `${distDir}/kirby-seo-audit`;
const zipName = `kirby-seo-audit-zero-one-${version}.zip`;

await fsp.rm(distDir, { recursive: true, force: true });
await fsp.mkdir(distDir, { recursive: true });

// `export-ignore` in `.gitattributes` decides what the archive carries.
await run("git", [
  "archive",
  "--format=tar",
  "--prefix=kirby-seo-audit/",
  `--output=${distDir}/source.tar`,
  "HEAD",
]);
await run("tar", ["-x", "-f", "source.tar"], { cwd: distDir });
await fsp.rm(`${distDir}/source.tar`);

await fsp.cp("zero-one", pluginDir, { recursive: true });

// The plugin's own classes are still PSR-4 autoloaded. `composer install`
// rebuilds the autoloader together with the `InstalledVersions` class its
// class map points to, which `dump-autoload` leaves out.
const composer = JSON.parse(
  await fsp.readFile(`${pluginDir}/composer.json`, "utf8"),
);
delete composer.require;
delete composer["require-dev"];
await fsp.writeFile(
  `${pluginDir}/composer.json`,
  `${JSON.stringify(composer, undefined, 2)}\n`,
);
await fsp.rm(`${pluginDir}/vendor`, { recursive: true, force: true });
await run("composer", [
  "install",
  "--no-dev",
  "--no-interaction",
  `--working-dir=${pluginDir}`,
]);
await fsp.rm(`${pluginDir}/composer.lock`, { force: true });

// The tracked `index.js` stays the main edition's.
await run("kirbyup", ["src/panel/index.ts", "--out-dir", pluginDir], {
  env: { ZERO_ONE: "true" },
});

await run("zip", ["-r", `../${zipName}`, "kirby-seo-audit"], { cwd: distDir });

await fsp.rm(distDir, { recursive: true, force: true });

console.log(`✓ Created: ${zipName}`);

function run(command, args, nodeOptions = {}) {
  return x(command, args, {
    throwOnError: true,
    nodeOptions: { stdio: "inherit", ...nodeOptions },
  });
}
