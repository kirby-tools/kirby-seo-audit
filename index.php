<?php

use JohannSchopplich\SeoAudit\Licensing;
use JohannSchopplich\SeoAudit\SeoAuditField;
use Kirby\Cms\App as Kirby;
use KirbyTools\Licensing\LicensePanel;
use KirbyTools\Licensing\PluginLicense;

// Composer's `conflict` cannot stop a copy unzipped into an older Kirby, so the plugin registers nothing there.
if (version_compare(Kirby::version() ?? '0', '6.0.0-alpha', '<')) {
    return;
}

@include_once __DIR__ . '/vendor/autoload.php';

Kirby::plugin(
    name: 'johannschopplich/seo-audit',
    extends: [
        'options' => [
            'cache' => true
        ],
        'api' => require __DIR__ . '/src/extensions/api.php',
        'areas' => [
            'system' => fn () => [
                'dialogs' => LicensePanel::dialogs(Licensing::PACKAGE_NAME, 'Kirby SEO Audit')
            ]
        ],
        'fields' => [
            'seo-audit' => SeoAuditField::class
        ],
        'hooks' => require __DIR__ . '/src/extensions/hooks.php',
        'translations' => require __DIR__ . '/src/extensions/translations.php',
        ...require __DIR__ . '/src/extensions/model-methods.php'
    ],
    license: fn ($plugin) => new PluginLicense($plugin, Licensing::PACKAGE_NAME)
);
