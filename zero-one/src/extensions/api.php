<?php

use JohannSchopplich\SeoAudit\PanelContext;
use JohannSchopplich\SeoAudit\PreviewTarget;
use JohannSchopplich\SeoAudit\Proxy;
use JohannSchopplich\SeoAudit\Rating;
use JohannSchopplich\SeoAudit\RatingStore;
use JohannSchopplich\SeoAudit\ViewButtonOptions;
use Kirby\Cms\App;
use Kirby\Cms\Find;
use Kirby\Cms\Page;
use Kirby\Cms\Site;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\PermissionException;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__seo-audit__/context',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                if ($kirby->plugin('zero/zero-one') === null) {
                    throw new PermissionException(
                        'This edition of Kirby SEO Audit is bundled exclusively with the Zero One Theme. For standalone use, please visit https://kirby.tools/seo-audit/buy'
                    );
                }

                $assets = $kirby
                    ->plugin('johannschopplich/seo-audit')
                    ->assets()
                    ->clone()
                    ->map(fn ($asset) => [
                        'filename' => $asset->filename(),
                        'url' => $asset->url()
                    ])
                    ->values();

                return [
                    'config' => PanelContext::config(),
                    'assets' => $assets,
                    'licenseStatus' => 'active'
                ];
            }
        ],
        [
            'pattern' => '__seo-audit__/button-options',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $path = $kirby->request()->get('path');

                if (!is_string($path) || $path === '') {
                    throw new InvalidArgumentException('Missing model path');
                }

                // `Find::parent` enforces the model's own access permissions.
                return ViewButtonOptions::resolve(Find::parent($path));
            }
        ],
        [
            'pattern' => '__seo-audit__/preview-url',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $request = $kirby->request();
                $path = $request->get('path');

                if (!is_string($path) || $path === '') {
                    throw new InvalidArgumentException('Missing model path');
                }

                $version = $request->get('version', 'latest');

                return PreviewTarget::resolve(
                    Find::parent($path),
                    is_string($version) ? $version : 'latest'
                );
            }
        ],
        [
            'pattern' => '__seo-audit__/rating',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $path = $kirby->request()->get('path');

                if (!is_string($path) || $path === '') {
                    throw new InvalidArgumentException('Missing model path');
                }

                $model = Find::parent($path);

                // A file has no rating, and its view must not fail on the read.
                if (!$model instanceof Page && !$model instanceof Site) {
                    return Rating::unrated()->toArray();
                }

                return (new RatingStore($kirby))->read($model)->toArray();
            }
        ],
        [
            'pattern' => '__seo-audit__/rating',
            'method' => 'POST',
            'action' => function () use ($kirby) {
                $request = $kirby->request();
                $path = $request->get('path');

                if (!is_string($path) || $path === '') {
                    throw new InvalidArgumentException('Missing model path');
                }

                $model = Find::parent($path);

                if (!$model instanceof Page && !$model instanceof Site) {
                    throw new InvalidArgumentException('Model has no rating: ' . $model::class);
                }

                // An editor who may preview but not update analyzes without
                // leaving a rating behind.
                if ($model->permissions()->can('update') !== true) {
                    throw new PermissionException('You are not allowed to store a rating for this model');
                }

                return (new RatingStore($kirby))->write(
                    model: $model,
                    seo: $request->get('seo'),
                    readability: $request->get('readability'),
                    counts: $request->get('counts'),
                    version: $request->get('version', 'latest')
                )->toArray();
            }
        ],
        [
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => fn () => (new Proxy($kirby))->handle()
        ]
    ]
];
