<?php

use Kirby\Http\Remote;
use Kirby\Http\Response;
use Kirby\Http\Uri;

return [
    'routes' => fn (\Kirby\Cms\App $kirby) => [
        [
            'pattern' => '__seo-audit__/proxy',
            'method' => 'POST',
            'action' => function () use ($kirby) {
                $request = $kirby->request();
                $url = new Uri($request->get('url'));
                $proxyUrlTransformer = $kirby->option('johannschopplich.seo-audit.proxyUrlTransformer');

                if (is_callable($proxyUrlTransformer)) {
                    $url = $proxyUrlTransformer($url);
                }

                $response = Remote::request($url->toString());

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
