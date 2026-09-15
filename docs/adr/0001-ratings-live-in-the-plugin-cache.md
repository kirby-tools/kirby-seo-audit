# Ratings Live in the Plugin Cache

A rating has to outlive the Panel session and be readable in templates and blueprint queries, so it lives on the server. The two obvious homes were rejected: a field in the content file turns every analysis into an edit (modification time, hooks, unsaved changes, a diff for every user) and would move the very modification time staleness is measured against, so every rating would be born stale; a dotfile in the page folder leaves ghost folders behind that Kirby's page listing cannot explain or delete. Ratings therefore live in the plugin cache, keyed by page UUID – or by page ID where UUIDs are off – and language, with the site under its own key.

## Consequences

- A cache miss reads as "unrated". Clearing the cache drops every rating, and each page gets its rating back only when someone analyzes it again, or publishes it with `auto: publish` on.
- A site that disables the plugin cache gets Kirby's null cache: every write succeeds, every read is unrated, and nothing reports it.
- Without UUIDs the key is the page ID, so moving or renaming a page orphans its rating.
- The cache key carries a version prefix. Bumping it discards every rating at once and leaves the old entries in the cache, since nothing expires them.
- Whether a rating is stale is derived on read from the published version's modification time, never stored.
- A deleted page drops its ratings through a hook, since nothing else ties the cache entry to the page.
