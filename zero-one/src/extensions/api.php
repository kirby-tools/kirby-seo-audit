<?php

use JohannSchopplich\SeoAudit\PanelContext;
use JohannSchopplich\SeoAudit\Proxy;
use JohannSchopplich\SeoAudit\ViewButtonOptions;
use Kirby\Cms\App;
use Kirby\Cms\Find;
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
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => fn () => (new Proxy($kirby))->handle()
        ]
    ]
];
