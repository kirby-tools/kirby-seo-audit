<?php

use Kirby\Cms\App as Kirby;
use Kirby\Plugin\License as KirbyLicense;
use Kirby\Plugin\LicenseStatus as KirbyLicenseStatus;
use Kirby\Plugin\Plugin;

@include_once __DIR__ . '/vendor/autoload.php';

$pluginConfig = [
    'name' => 'johannschopplich/seo-audit',
    'extends' => [
        'api' => require __DIR__ . '/src/extensions/api.php',
        'sections' => require __DIR__ . '/src/extensions/sections.php',
        'translations' => require __DIR__ . '/src/extensions/translations.php'
    ]
];

if (class_exists('\Kirby\Plugin\License')) {
    Kirby::plugin(
        ...$pluginConfig,
        license: fn ($plugin) => new KirbyLicense(
            plugin: $plugin,
            name: 'Kirby Tools Plugins License (Zero One Edition)',
            link: 'https://kirby.tools/license/zero-one-edition',
            status: new KirbyLicenseStatus(
                value: 'active',
                label: 'Licensed',
                icon: 'check',
                theme: 'positive'
            )
        )
    );
} else {
    Kirby::plugin(...$pluginConfig);
}
