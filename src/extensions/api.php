<?php

use Kirby\Cms\App;
use Kirby\Http\Remote;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => function () use ($kirby) {
                $url = $kirby->request()->get('url');
                $urlResolver = $kirby->option('johannschopplich.seo-audit.proxy.urlResolver');
                $params = $kirby->option('johannschopplich.seo-audit.proxy.params', []);

                if (is_callable($urlResolver)) {
                    $url = $urlResolver($url);
                }

                $response = Remote::request($url, $params);

                return [
                    'code' => $response->code(),
                    'html' => $response->content()
                ];
            }
        ],
    ]
];
