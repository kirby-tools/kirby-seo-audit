# Playground

Two modes, switched by `KIRBY_DEBUG` in `.env`:

- **Shared demo** (`false`): no frontend, every URL goes to the Panel, `/panel/login` signs in the `playground` role, changes are never written.
- **Local testing** (`true`): pages render under `/` and `/de`, `/panel/login` signs in as admin, `/panel/login?role=playground` as the role that may preview but not update.

`composer dev` serves it on `localhost:8000`.

## What the pages test

| View              | Set up for                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `article`         | View button and section on one view: a run from either shows in both, one rating is stored |
| `article-section` | Section only, `persisted: false`, `auto: false` overriding the global `auto: publish`       |
| `site`            | View button and section on the site, keyphrase and synonyms from site fields               |

The config sets `auto: publish`, so a publish on `article` or `site` reruns the analysis silently. Two languages (`en`, `de`) keep one rating each. Ratings live in `storage/cache`; delete `storage/cache/localhost_8000/johannschopplich/seo-audit` to unrate everything.
