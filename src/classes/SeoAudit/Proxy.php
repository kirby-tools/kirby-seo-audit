<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Closure;
use Kirby\Cms\App;
use Kirby\Cms\File;
use Kirby\Cms\Find;
use Kirby\Cms\Page;
use Kirby\Cms\Site;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\NotFoundException;
use Kirby\Http\Remote;

/**
 * Fetches the HTML behind a model's preview URL for analysis.
 */
final class Proxy
{
    private const OPTION_PREFIX = 'johannschopplich.seo-audit.proxy.';

    public function __construct(private readonly App $kirby)
    {
    }

    /**
     * Fetches the preview HTML of the model named by the request.
     *
     * @return array{code: int|null, html: string|null}
     * @throws InvalidArgumentException When the request names no model
     */
    public function handle(): array
    {
        $response = Remote::request(
            $this->resolveTarget(),
            $this->kirby->option(self::OPTION_PREFIX . 'params', [])
        );

        return [
            'code' => $response->code(),
            'html' => $response->content()
        ];
    }

    /**
     * Resolves the URL the request asks the proxy to fetch.
     *
     * `allowArbitraryUrls` hands the target back to the caller, which is the
     * whole thing this class exists to prevent, so it stays off by default and
     * undocumented. The playground needs it: it analyzes a URL typed into a
     * field, which belongs to no model, and a browser-side fetch would hit CORS.
     *
     * @throws InvalidArgumentException When the request names no model
     */
    public function resolveTarget(): string
    {
        $request = $this->kirby->request();
        $url = $request->get('url');

        if (
            $this->kirby->option(self::OPTION_PREFIX . 'allowArbitraryUrls') === true &&
            is_string($url) &&
            $url !== ''
        ) {
            return $this->applyUrlResolver($url);
        }

        $path = $request->get('path');

        if (!is_string($path) || $path === '') {
            throw new InvalidArgumentException('Missing model path');
        }

        return $this->resolveUrl($path);
    }

    /**
     * Resolves a Panel path to the preview URL of the model behind it.
     *
     * On this path the URL never comes from the request: the caller names a
     * model and the server derives its preview URL, so no request can aim the
     * proxy at a host of its own choosing. `Find::parent` enforces the model's
     * own access permissions on the way.
     *
     * A blueprint may still set `options.preview` to a query, which resolves
     * against the model's own content. The proxy then reaches wherever the
     * site chose to point its preview button, which is the site's call to
     * make, not a target the request picked.
     *
     * @throws InvalidArgumentException When the model cannot carry a preview URL
     * @throws NotFoundException When the model is inaccessible or has no preview URL
     */
    public function resolveUrl(string $path): string
    {
        $model = Find::parent($path);

        $url = match (true) {
            $model instanceof Page,
            $model instanceof Site,
            $model instanceof File => $model->previewUrl(),
            default => throw new InvalidArgumentException(
                'Model cannot be analyzed: ' . $model::class
            )
        };

        if ($url === null) {
            throw new NotFoundException('Model has no preview URL: ' . $path);
        }

        return $this->applyUrlResolver($url);
    }

    private function applyUrlResolver(string $url): string
    {
        $urlResolver = $this->kirby->option(self::OPTION_PREFIX . 'urlResolver');

        if (!$urlResolver instanceof Closure) {
            return $url;
        }

        $resolved = $urlResolver($url);

        // Retargeting the URL is the resolver's whole purpose, so its result is
        // trusted. Its type is not: a misconfigured resolver would otherwise
        // surface as a type error deep inside `Remote`.
        if (!is_string($resolved) || $resolved === '') {
            throw new InvalidArgumentException(
                'The `proxy.urlResolver` option must return a non-empty string'
            );
        }

        return $resolved;
    }
}
