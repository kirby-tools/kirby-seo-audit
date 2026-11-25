<?php

use Kirby\Data\Json;

$translations = [];

foreach (glob(dirname(__DIR__, 2) . '/translations/*.json') as $file) {
    $translations[pathinfo($file, PATHINFO_FILENAME)] = Json::read($file);
}

// Kirby ships no bare `es` translation.
$translations['es_ES'] = $translations['es_419'] = $translations['es'];

return $translations;
