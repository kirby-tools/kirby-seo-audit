<?php

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'locking' => false
    ],

    'panel' => [
        'css' => 'assets/panel.css',
        'favicon' => 'assets/favicon.ico',
        'frameAncestors' => ['https://kirbyseo.com']
    ]
];
