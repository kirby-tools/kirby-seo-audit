<?php

use JohannSchopplich\Licensing\LicensePanel;
use JohannSchopplich\Licensing\Licenses;
use JohannSchopplich\SeoAudit\PanelContext;
use JohannSchopplich\SeoAudit\Proxy;
use Kirby\Cms\App;

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
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => fn () => (new Proxy($kirby))->handle()
        ]
    ]
];
