<?php

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'locking' => false
    ],

    'johannschopplich.seo-audit' => [
        'proxy' => [
            // The playground analyzes a URL typed into a field, which belongs to
            // no model. Never set this in a real installation: it lets any Panel
            // account reach any host the server can.
            'allowArbitraryUrls' => true
        ]
    ],

    'panel' => [
        'css' => 'assets/panel.css',
        'favicon' => 'favicon.ico',
        'vue' => [
            'compiler' => false
        ]
    ]
];
