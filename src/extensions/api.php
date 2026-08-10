<?php

use JohannSchopplich\Licensing\LicensePanel;
use JohannSchopplich\Licensing\Licenses;
use JohannSchopplich\SeoAudit\BlueprintOptions;
use JohannSchopplich\SeoAudit\PanelContext;
use JohannSchopplich\SeoAudit\Proxy;
use Kirby\Cms\App;
use Kirby\Cms\Find;
use Kirby\Exception\InvalidArgumentException;

return [
    'routes' => fn (App $kirby) => [
        ...LicensePanel::api('johannschopplich/kirby-seo-audit'),
        [
            'pattern' => '__seo-audit__/context',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $licenses = Licenses::read('johannschopplich/kirby-seo-audit');

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
                    'licenseStatus' => $licenses->getStatus()
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
                return BlueprintOptions::forViewButton(Find::parent($path));
            }
        ],
        [
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => fn () => (new Proxy($kirby))->handle()
        ]
    ]
];
