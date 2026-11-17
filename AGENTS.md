# Kirby SEO Audit

Commercial Kirby CMS plugin that runs SEO and readability analysis on a page's rendered HTML, powered by Yoast SEO. The analysis happens in the Panel; the server fetches the HTML and keeps the ratings.

Use the terms from `GLOSSARY.md`. Decisions are in `docs/adr/`.

## Commands

```bash
composer test
composer csfix         # lives in tools/phpcs/vendor/bin/, not vendor/bin/
pnpm test --run
pnpm run test:types
pnpm run lint
pnpm run build:zero-one
```

## Conventions

- `src/panel/site.ts` feeds kirby.tools' Panel mocks.

## The Zero One Edition

`zero-one/` holds override files for the edition bundled with the Zero One Theme; that edition ships without the licensing package.
