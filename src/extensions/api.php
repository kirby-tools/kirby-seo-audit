<?php

use Kirby\Http\Remote;
use Kirby\Http\Response;

return [
    'routes' => fn (\Kirby\Cms\App $kirby) => [
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

                return Response::json([
                    'code' => $response->code(),
                    'result' => [
                        'html' => $response->content()
                    ]
                ], 200);
            }
        ],
    ]
];
