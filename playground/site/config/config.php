<?php

use Kirby\Cms\App;
use Kirby\Cms\Site;
use Kirby\Exception\Exception;
use Kirby\Panel\Panel;

return [
    'debug' => env('KIRBY_DEBUG', false),

    'content' => [
        'locking' => false
    ],

    'panel' => [
        'css' => 'assets/panel.css',
        'js' => 'assets/panel.js',
        'frameAncestors' => ['https://kirbyseo.com']
    ],

    'hooks' => [
        'site.update:before' => function (Site $site, array $values, array $strings) {
            if (env('KIRBY_DEBUG', false) === false) {
                throw new Exception('You cannot save changes to the playground content, you can only make local changes as a preview.');
            }
        },

        'system.loadPlugins:after' => function () {
            $kirby = App::instance();

            $kirby->extend([
                'routes' => fn (App $kirby) => [
                    [
                        'pattern' => '(:all)',
                        'action' => function () use ($kirby) {
                            go(Panel::url($kirby->user() === null ? 'login' : 'site'));
                        }
                    ]
                ],
                'areas' => [
                    'login' => function (App $kirby) {
                        return [
                            'views' => [
                                // Auto-login for the playground
                                'login' => [
                                    'pattern' => 'login',
                                    'auth' => false,
                                    'action' => function () use ($kirby) {
                                        if ($kirby->user() === null) {
                                            // $system = $kirby->system();
                                            // $role = $system->isLocal() ? 'admin' : 'playground';
                                            $isDebug = env('KIRBY_DEBUG', false);
                                            $role = $isDebug ? 'admin' : 'playground';
                                            $kirby->users()->role($role)->first()->loginPasswordless();
                                        }

                                        go(Panel::url('site'));
                                    }
                                ]
                            ]
                        ];
                    }
                ]
            ], $kirby->plugin('johannschopplich/seo-audit'));
        }
    ]
];
