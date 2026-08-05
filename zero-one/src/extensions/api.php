<?php

use JohannSchopplich\SeoAudit\PanelContext;
use JohannSchopplich\SeoAudit\Proxy;
use Kirby\Cms\App;
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
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => fn () => (new Proxy($kirby))->handle()
        ]
    ]
];
