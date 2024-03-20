<?php

use Kirby\Cms\App;
use Kirby\Cms\Event;
use Kirby\Exception\Exception;
use Kirby\Panel\Panel;

App::plugin('johannschopplich/playground', [
    'hooks' => [
        '*.update:before' => function (Event $event) {
            if (env('KIRBY_DEBUG', false) === false) {
                throw new Exception('Saving changed content to the playground is not allowed. You can only make changes locally.');
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
                    'login' => fn (App $kirby) => [
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
                    ]
                ]
            ], $kirby->plugin('johannschopplich/playground'));
        }
    ],
    'sections' => [
        'playground-blueprint-code' => [
            'props' => [
                'label' => fn ($label = null) => $label,
                'help' => fn ($help = null) => $help
            ]
        ]
    ]
]);
