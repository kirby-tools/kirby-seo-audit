<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Cache\Cache;
use Kirby\Cms\App;
use Kirby\Cms\Page;
use Kirby\Cms\Site;
use Kirby\Uuid\PageUuid;

/**
 * Keeps one rating per page and language in the plugin cache. The content
 * file stays untouched, so an analysis never counts as an edit, and the page
 * folder stays clean, so Kirby can still remove it.
 */
final class RatingStore
{
    public const CACHE_NAME = 'johannschopplich.seo-audit';
    public const CACHE_PREFIX = 'rating.1.';

    public function __construct(private readonly App $kirby)
    {
    }

    public function read(Page|Site $model, string|null $languageCode = null): Rating
    {
        $languageCode = $this->languageCode($languageCode);
        $record = $this->cache()->get($this->key(self::modelKey($model), $languageCode));

        if (!is_array($record)) {
            return Rating::unrated();
        }

        return Rating::fromRecord($record, $this->modified($model, $languageCode));
    }

    /**
     * @throws \Kirby\Exception\InvalidArgumentException When the record is malformed
     */
    public function write(
        Page|Site $model,
        mixed $seo,
        mixed $readability,
        mixed $counts,
        mixed $version,
        string|null $languageCode = null
    ): Rating {
        $languageCode = $this->languageCode($languageCode);
        $record = Rating::toRecord($seo, $readability, $counts, $version, time());

        $this->cache()->set($this->key(self::modelKey($model), $languageCode), $record);

        return Rating::fromRecord($record, $this->modified($model, $languageCode));
    }

    /**
     * Drops the ratings of a page in every language, under both the UUID and
     * the ID the page may have been keyed by before it had a UUID.
     */
    public function remove(Page $page): void
    {
        $cache = $this->cache();
        $modelKeys = array_unique(array_filter([PageUuid::retrieveId($page), $page->id()]));

        foreach ($this->languageCodes() as $languageCode) {
            foreach ($modelKeys as $modelKey) {
                $cache->remove($this->key($modelKey, $languageCode));
            }
        }
    }

    private static function modelKey(Page|Site $model): string
    {
        if ($model instanceof Site) {
            return 'site';
        }

        return PageUuid::retrieveId($model) ?? $model->id();
    }

    private function key(string $modelKey, string $languageCode): string
    {
        return self::CACHE_PREFIX . $modelKey . '.' . $languageCode;
    }

    private function cache(): Cache
    {
        return $this->kirby->cache(self::CACHE_NAME);
    }

    private function languageCode(string|null $languageCode): string
    {
        return $languageCode ?? $this->kirby->languageCode() ?? 'default';
    }

    /** @return list<string> */
    private function languageCodes(): array
    {
        if (!$this->kirby->multilang()) {
            return ['default'];
        }

        return $this->kirby->languages()->values(fn ($language) => $language->code());
    }

    private function modified(Page|Site $model, string $languageCode): int|null
    {
        // The published version's own time, not the folder's: a site must not
        // go stale because any page changed.
        if (!method_exists($model, 'version')) {
            return null;
        }

        return $model->version('latest')->modified(
            $this->kirby->multilang() ? $languageCode : 'default'
        );
    }
}
