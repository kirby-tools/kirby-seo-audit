<?php

use Kirby\Cms\App as Kirby;

@include_once __DIR__ . '/vendor/autoload.php';

$packageName = 'johannschopplich/kirby-seo-audit';
$pluginConfig = [
    'name' => 'johannschopplich/seo-audit',
    'extends' => [
        'options' => [
            'cache' => true
        ],
        'api' => require __DIR__ . '/src/extensions/api.php',
        'hooks' => require __DIR__ . '/src/extensions/hooks.php',
        'sections' => require __DIR__ . '/src/extensions/sections.php',
        'translations' => require __DIR__ . '/src/extensions/translations.php',
        ...require __DIR__ . '/src/extensions/model-methods.php'
    ]
];

if (class_exists('Kirby\Plugin\License')) {
    $pluginConfig['extends']['areas'] = [
        'system' => fn () => [
            'dialogs' => \JohannSchopplich\Licensing\LicensePanel::dialogs($packageName, 'Kirby SEO Audit')
        ]
    ];

    Kirby::plugin(
        ...$pluginConfig,
        license: fn ($plugin) => new \JohannSchopplich\Licensing\PluginLicense($plugin, $packageName)
    );
} else {
    Kirby::plugin(...$pluginConfig);
}
