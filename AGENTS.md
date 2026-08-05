# Kirby SEO Audit

Commercial Kirby CMS plugin that runs SEO and readability analysis on a page's rendered HTML, powered by Yoast SEO. The analysis happens in the Panel; the server only fetches the HTML and answers a small configuration route.

## Commands

- `composer test` – PHPUnit
- `composer csfix` – php-cs-fixer, which lives in `tools/phpcs/vendor/bin/`, not `vendor/bin/`
- `pnpm test` – Vitest, for the assessment utilities
- `pnpm run lint` – ESLint
- `pnpm run build:zero-one` – build the Zero One edition

## The Zero One Edition

`zero-one/` holds override files for the edition bundled with the Zero One Theme. The build takes a `git archive` of `HEAD`, copies `zero-one/` over it, strips the Composer `require` block and deletes `vendor/`.

Three consequences:

- A change to `api.php` or `index.php` has to be made in both copies. They diverge only in licensing.
- Only committed files reach the archive, and `.gitattributes` decides what it carries.
- The edition ships no Composer dependencies, so the build runs `composer dump-autoload` to rebuild the PSR-4 autoloader for the plugin's own classes. Without it those classes are silently missing at runtime, because `index.php` includes the autoloader with `@include_once`.

## Conventions

- The Panel receives an explicit allow-list from `PanelContext`, never the raw option tree. `proxy` in particular holds closures and whatever credentials its `params` carry.
- `__PLAYGROUND__` and `__ZERO_ONE__` are build-time constants from `kirbyup.config.js`, declared to ESLint in `eslint.config.mjs` because the Panel source is plain JavaScript.
- Test methods are snake_case with no `test` prefix, marked `#[Test]`; data providers are camelCase.

## Search Hints

- `window.panel.plugin("johannschopplich/seo-audit"` – Panel registration
- `Kirby::plugin(` – PHP plugin registration
- `useSeoReview` – main composable
- `__seo-audit__/` – API route patterns
