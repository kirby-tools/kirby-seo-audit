<?php

use Kirby\Cms\App as Kirby;

@include_once __DIR__ . '/vendor/autoload.php';

Kirby::plugin('johannschopplich/seo-audit', [
    'api' => require __DIR__ . '/src/extensions/api.php',
    'sections' => require __DIR__ . '/src/extensions/sections.php',
    'translations' => require __DIR__ . '/src/extensions/translations.php'
]);
