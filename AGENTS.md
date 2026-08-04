# Kirby SEO Audit

Commercial Kirby CMS plugin that runs SEO and readability analysis on a page's rendered HTML, powered by Yoast SEO. The analysis happens in the Panel; the server only fetches the HTML and answers a small configuration route.

## Tech Stack

- Panel: Vue 2.7 with Composition API (`<script setup>`, composables)
- Build: kirbyup (Vite-based bundler for Kirby Panel plugins)
- Vue utilities: kirbyuse (provides `usePanel`, `useSection`, `useContent`, etc.)
- Analysis: `yoastseo`, bundled into `assets/` from `src/assets`
- PHP: Kirby 4/5 compatible, PHPUnit 12

## Commands

- `composer test` – run PHPUnit
- `pnpm run lint` – ESLint
- `pnpm test` – Vitest, for the assessment utilities
- `composer csfix` – php-cs-fixer, which lives in `tools/phpcs/vendor/bin/`, not `vendor/bin/`

## Entry Points

- Plugin ID: `johannschopplich/seo-audit`
- PHP bootstrap: `index.php` (registers API routes, sections, translations)
- Panel entry: `src/panel/index.js` (registers Vue components via `window.panel.plugin()`)
- API routes: `src/extensions/api.php`
- Local dev: `playground/` (self-contained Kirby installation)

## Architecture

PHP classes in `src/classes/SeoAudit/`:

- `PanelContext`: builds the config envelope the Panel receives
- `Proxy`: resolves a Panel path to that model's preview URL and fetches the HTML

PHP extensions in `src/extensions/`:

- `api.php`: `__seo-audit__/` routes for context and proxy
- `sections.php`: the `seo-audit` section
- `translations.php`: i18n strings

## The Zero One Edition

`zero-one/` holds override files for the edition bundled with the Zero One Theme. `pnpm run build:zero-one` takes a `git archive` of `HEAD`, copies `zero-one/` over it, strips the Composer `require` block and deletes `vendor/`.

Three consequences:

- A change to `api.php` or `index.php` has to be made in both copies. They diverge only in licensing.
- Only committed files reach the archive, and `.gitattributes` decides what it carries.
- The edition ships no Composer dependencies, so the build runs `composer dump-autoload` to rebuild the PSR-4 autoloader for the plugin's own classes. Without it those classes are silently missing at runtime, because `index.php` includes the autoloader with `@include_once`.

## Conventions

- The proxy takes a Panel path and derives the URL from the model itself. It never accepts a URL, or any Panel account could aim it at the server's internal network.
- The Panel receives an explicit allow-list from `PanelContext`, never the raw option tree. `proxy` in particular holds closures and whatever credentials its `params` carry.
- `__PLAYGROUND__` and `__ZERO_ONE__` are build-time constants from `kirbyup.config.js`, declared to ESLint in `eslint.config.mjs`.
- Comments explain why, not what. In `src/classes/**` a wrapped comment ends with a full stop and a single-line one does not; comments in `tests/**` and `src/panel/**` never do.
- Test methods are snake_case and named after the behavior they pin; data providers are camelCase.

## Search Hints

- `window.panel.plugin("johannschopplich/seo-audit"` – Panel registration
- `App::plugin(` – PHP plugin registration
- `useSeoReview` – main composable
- `__seo-audit__/` – API route patterns
