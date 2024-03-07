<?php

use Kirby\Cms\PluginAsset;
use Kirby\Toolkit\I18n;

return [
    'seo-audit' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label),
            'keyphraseField' => fn ($keyphraseField = null) => is_string($keyphraseField) ? strtolower($keyphraseField) : null,
            'assessments' => fn ($assessments = []) => is_array($assessments) ? $assessments : [],
            'links' => fn ($links = true) => $links !== false,
            'persisted' => fn ($persisted = true) => $persisted !== false,
            'logLevel' => fn ($logLevel = null) => in_array($logLevel, ['error', 'warn', 'info', 'debug'], true) ? $logLevel : 'warn'
        ],
        'computed' => [
            'config' => function () {
                /** @var \Kirby\Cms\App */
                $kirby = $this->kirby();
                $config = $kirby->option('johannschopplich.seo-audit', []);

                $defaultConfig = [];

                // Merge user configuration with defaults
                $config = array_replace_recursive($defaultConfig, $config);

                // Remove `proxyUrlResolver` transformer function
                unset($config['transformers']);

                return $config;
            },
            'assets' => function () {
                /** @var \Kirby\Cms\App */
                $kirby = $this->kirby();
                $plugin = $kirby->plugin('johannschopplich/seo-audit');

                return $plugin
                    ->assets()
                    ->clone()
                    ->map(fn (PluginAsset $asset) => [
                        'filename' => $asset->filename(),
                        'url' => $asset->url()
                    ])
                    ->values();
            }
        ],
        'methods' => [
            'tryResolveQuery' => function ($value, $fallback = null) {
                if (is_string($value) && str_starts_with($value, '{{') && str_ends_with($value, '}}')) {
                    return $this->model()->query(substr($value, 2, -2));
                }

                return $value ?? $fallback;
            }
        ]
    ]
];
