<?php

use Kirby\Cms\App as Kirby;

Kirby::plugin('johannschopplich/playground', [
    'sections' => [
        'playground-blueprint-code' => [
            'props' => [
                'help' => fn ($help = null) => $help
            ]
        ]
    ]
]);
