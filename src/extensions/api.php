<?php

use Kirby\Http\Remote;
use Kirby\Http\Response;
use Kirby\Http\Uri;

return [
    'routes' => fn (\Kirby\Cms\App $kirby) => [
        [
            'pattern' => '__seo-report__/proxy',
            'method' => 'POST',
            'action' => function () use ($kirby) {
                $request = $kirby->request();
                $url = new Uri($request->get('url'));
                $isDocker = $kirby->option('johannschopplich.seo-report.isDocker', false);

                // Resolve to the host URL if inside Docker container
                if ($isDocker) {
                    $url->setHost('host.docker.internal');
                }

                $response = Remote::request($url->toString());

                return Response::json([
                    'code' => $response->code(),
                    'result' => [
                        'html' => $response->content()
                    ]
                ], $response->code());
            }
        ],
    ]
];
