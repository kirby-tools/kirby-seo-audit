<?php

use JohannSchopplich\SeoAudit\SeoAuditField;
use Kirby\Cms\App as Kirby;
use Kirby\Plugin\License as KirbyLicense;
use Kirby\Plugin\LicenseStatus as KirbyLicenseStatus;
use Kirby\Toolkit\I18n;

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
        'fields' => [
            'seo-audit' => SeoAuditField::class
        ],
        'hooks' => require __DIR__ . '/src/extensions/hooks.php',
        'translations' => require __DIR__ . '/src/extensions/translations.php',
        ...require __DIR__ . '/src/extensions/model-methods.php'
    ],
    license: fn ($plugin) => new KirbyLicense(
        plugin: $plugin,
        name: 'Kirby Tools Plugins License (Zero One Edition)',
        link: 'https://kirby.tools/license/zero-one-edition',
        status: new KirbyLicenseStatus(
            value: 'active',
            label: I18n::translate('license.status.active.label'),
            icon: 'check',
            theme: 'positive'
        )
    )
);
