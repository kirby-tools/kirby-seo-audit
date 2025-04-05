<?php

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'locking' => false
    ],

    'panel' => [
        'css' => 'assets/panel.css',
        'favicon' => 'favicon.ico',
        'vue' => [
            'compiler' => false
        ],
        'frameAncestors' => ['https://kirbyseo.com']
    ]
];
