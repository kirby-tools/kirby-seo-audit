<?php

use Kirby\Cms\App as Kirby;

Kirby::plugin('johannschopplich/playground', [
    'sections' => [
        'playground-blueprint-code' => [
            'props' => [
                'label' => fn ($label = null) => $label,
                'help' => fn ($help = null) => $help
            ]
        ]
    ]
]);
