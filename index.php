<?php

use Composer\Semver\Semver;
use Kirby\Cms\App as Kirby;

// Validate Kirby version
if (!Semver::satisfies(Kirby::version() ?? '0.0.0', '~4.0')) {
    throw new Exception('Kirby SEO Insights requires Kirby 4');
}

Kirby::plugin('johannschopplich/seo-insights', [
    'api' => require __DIR__ . '/src/extensions/api.php',
    'sections' => require __DIR__ . '/src/extensions/sections.php',
    'translations' => require __DIR__ . '/src/extensions/translations.php'
]);
