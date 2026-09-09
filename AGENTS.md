# Kirby SEO Audit

Commercial Kirby CMS plugin that runs SEO and readability analysis on a page's rendered HTML, powered by Yoast SEO. The analysis happens in the Panel; the server only fetches the HTML and answers a small configuration route.

## Commands

```bash
composer test              # PHPUnit
composer csfix             # php-cs-fixer, lives in tools/phpcs/vendor/bin/, not vendor/bin/
pnpm test                  # Vitest, for the Panel utilities
pnpm run lint              # ESLint
pnpm run build:zero-one    # build the Zero One edition
```

## Conventions

- `__PLAYGROUND__` and `__ZERO_ONE__` are build-time constants defined in `kirbyup.config.js`.

## The Zero One Edition

`zero-one/` holds override files for the edition bundled with the Zero One Theme.
