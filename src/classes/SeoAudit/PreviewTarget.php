<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Cms\File;
use Kirby\Cms\ModelWithContent;
use Kirby\Cms\Page;
use Kirby\Cms\Site;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Http\Uri;

/**
 * The preview URL of a content version, along with the version the URL asks
 * for: a file has no versions, and a disabled preview has no URL.
 */
final class PreviewTarget
{
    public const VERSIONS = ['latest', 'changes'];

    /**
     * @return array{url: string|null, version: string}
     * @throws InvalidArgumentException When the version is unknown or the model cannot carry a preview URL
     */
    public static function resolve(ModelWithContent $model, string $version = 'latest'): array
    {
        if (!in_array($version, self::VERSIONS, true)) {
            throw new InvalidArgumentException('Unknown content version: ' . $version);
        }

        $url = match (true) {
            $model instanceof Page,
            $model instanceof Site => $model->previewUrl($version),
            $model instanceof File => $model->previewUrl(),
            default => throw new InvalidArgumentException(
                'Model cannot be analyzed: ' . $model::class
            )
        };

        return [
            'url' => $url,
            'version' => $url !== null && self::showsChanges($url) ? 'changes' : 'latest'
        ];
    }

    private static function showsChanges(string $url): bool
    {
        return (new Uri($url))->query()->get('_version') === 'changes';
    }
}
