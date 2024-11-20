<?php

use Composer\Semver\Semver;
use Kirby\Cms\App as Kirby;

@include_once __DIR__ . '/vendor/autoload.php';

// Validate Kirby version
if (!Semver::satisfies(Kirby::version() ?? '0.0.0', '^4.0 || >=5.0.0-alpha.1 <=5.0.0-alpha.3')) {
    throw new Exception('Kirby SEO Audit requires Kirby 4');
}

Kirby::plugin('johannschopplich/seo-audit', [
    'api' => require __DIR__ . '/src/extensions/api.php',
    'sections' => require __DIR__ . '/src/extensions/sections.php',
    'translations' => require __DIR__ . '/src/extensions/translations.php'
]);
