<?php

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'changes' => false,
        'locking' => false
    ],

    'panel' => [
        'css' => 'assets/panel.css',
        'favicon' => 'favicon.ico',
        'vue' => [
            'compiler' => false
        ]
    ]
];
