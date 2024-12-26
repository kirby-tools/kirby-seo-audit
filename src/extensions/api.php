<?php

use JohannSchopplich\Licensing\Licenses;
use Kirby\Cms\App;
use Kirby\Http\Remote;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__seo-audit__/context',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $licenses = Licenses::read('johannschopplich/kirby-seo-audit');
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
                    'licenseStatus' => $licenses->getStatus()
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
        ],
        [
            'pattern' => '__seo-audit__/activate',
            'method' => 'POST',
            'action' => function () {
                $licenses = Licenses::read('johannschopplich/kirby-seo-audit');
                return $licenses->activateFromRequest();
            }
        ]
    ]
];
