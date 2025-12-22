<?php

use Kirby\Cms\App;
use Kirby\Exception\PermissionException;
use Kirby\Http\Remote;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__seo-audit__/context',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                // Ensure the Zero One Theme plugin is installed
                if ($kirby->plugin('zero/zero-one') === null) {
                    throw new PermissionException(
                        'This edition of Kirby SEO Audit is bundled exclusively with the Zero One Theme. For standalone use, please visit https://kirby.tools/seo-audit/buy'
                    );
                }

                $config = $kirby->option('johannschopplich.seo-audit', []);

                $defaultConfig = [
                    'proxy' => [
                        'params' => []
                    ]
                ];

                // Merge user configuration with defaults
                $config = array_replace_recursive($defaultConfig, $config);

                // Remove proxy API configuration for the client
                unset($config['proxy']);

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
                    'config' => $config,
                    'assets' => $assets,
                    'licenseStatus' => 'active'
                ];
            }
        ],
        [
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => function () use ($kirby) {
                $url = $kirby->request()->get('url');
                $urlResolver = $kirby->option('johannschopplich.seo-audit.proxy.urlResolver');
                $params = $kirby->option('johannschopplich.seo-audit.proxy.params', []);

                if (is_callable($urlResolver)) {
                    $url = $urlResolver($url);
                }

                $response = Remote::request($url, $params);

                return [
                    'code' => $response->code(),
                    'html' => $response->content()
                ];
            }
        ]
    ]
];
