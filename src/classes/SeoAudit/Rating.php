<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Exception\InvalidArgumentException;
use Stringable;

/**
 * What an analysis leaves behind: one traffic light per category, the
 * counts behind them, and what was analyzed when. Reads like a field in
 * blueprint queries, where the string form is the worse of the two lights.
 */
final class Rating implements Stringable
{
    /** Ascending, so the first match is the light an editor acts on first. */
    public const RATINGS = ['bad', 'ok', 'good'];
    public const VERSIONS = PreviewTarget::VERSIONS;

    private function __construct(
        private readonly string|null $seo,
        private readonly string|null $readability,
        private readonly array $counts,
        private readonly string|null $version,
        private readonly int|null $timestamp,
        private readonly bool $isStale
    ) {
    }

    public static function unrated(): self
    {
        return new self(null, null, ['good' => 0, 'ok' => 0, 'bad' => 0], null, null, false);
    }

    public static function fromRecord(array $record, int|null $modified): self
    {
        $timestamp = $record['timestamp'];

        return new self(
            $record['seo'],
            $record['readability'],
            $record['counts'],
            $record['version'],
            $timestamp,
            $modified !== null && $modified > $timestamp
        );
    }

    /**
     * Validates what the Panel reports and shapes it into a record.
     *
     * @return array<string, mixed>
     * @throws InvalidArgumentException When a light, count, or version is not one the plugin knows
     */
    public static function toRecord(mixed $seo, mixed $readability, mixed $counts, mixed $version, int $timestamp): array
    {
        foreach (['seo' => $seo, 'readability' => $readability] as $category => $light) {
            if ($light !== null && !in_array($light, [...self::RATINGS, 'none'], true)) {
                throw new InvalidArgumentException('Invalid ' . $category . ' rating: ' . var_export($light, true));
            }
        }

        if (!is_array($counts)) {
            throw new InvalidArgumentException('Invalid rating counts');
        }

        foreach (self::RATINGS as $rating) {
            if (!is_int($counts[$rating] ?? null) || $counts[$rating] < 0) {
                throw new InvalidArgumentException('Invalid rating count for ' . $rating);
            }
        }

        if (!in_array($version, self::VERSIONS, true)) {
            throw new InvalidArgumentException('Unknown content version: ' . var_export($version, true));
        }

        return [
            'seo' => $seo,
            'readability' => $readability,
            'counts' => array_intersect_key($counts, array_flip(self::RATINGS)),
            'version' => $version,
            'timestamp' => $timestamp
        ];
    }

    /**
     * Picks the worse of the two lights, or an empty string before the first analysis.
     */
    public function rating(): string
    {
        foreach (self::RATINGS as $rating) {
            if ($this->seo === $rating || $this->readability === $rating) {
                return $rating;
            }
        }

        return '';
    }

    /**
     * Ranks the rating for `sortBy`: unrated 0, then bad, ok, good.
     */
    public function score(): int
    {
        $index = array_search($this->rating(), self::RATINGS, true);

        return $index === false ? 0 : $index + 1;
    }

    public function seo(): string
    {
        return $this->seo ?? '';
    }

    public function readability(): string
    {
        return $this->readability ?? '';
    }

    /** @return array{good: int, ok: int, bad: int} */
    public function counts(): array
    {
        return $this->counts;
    }

    public function version(): string
    {
        return $this->version ?? '';
    }

    public function timestamp(): int|null
    {
        return $this->timestamp;
    }

    public function isRated(): bool
    {
        return $this->timestamp !== null;
    }

    public function isStale(): bool
    {
        return $this->isStale;
    }

    public function __toString(): string
    {
        return $this->rating();
    }

    public function toArray(): array
    {
        return [
            'seo' => $this->seo,
            'readability' => $this->readability,
            'counts' => $this->counts,
            'version' => $this->version,
            'timestamp' => $this->timestamp,
            'isStale' => $this->isStale
        ];
    }
}
