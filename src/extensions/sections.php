<?php

use JohannSchopplich\Licensing\Licenses;
use Kirby\Cms\PluginAsset;
use Kirby\Toolkit\I18n;

return [
    'seo-audit' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label),
            'keyphrase' => fn ($keyphrase = null) => $keyphrase,
            'keyphraseField' => fn ($keyphraseField = null) => is_string($keyphraseField) ? strtolower($keyphraseField) : null,
            'synonyms' => fn ($synonyms = null) => $synonyms,
            'synonymsField' => fn ($synonymsField = null) => is_string($synonymsField) ? strtolower($synonymsField) : null,
            'assessments' => fn ($assessments = []) => is_array($assessments) ? $assessments : [],
            'contentSelector' => fn ($contentSelector = null) => is_string($contentSelector) ? $contentSelector : 'body',
            'links' => fn ($links = true) => $links !== false,
            'persisted' => fn ($persisted = true) => $persisted !== false,
            'logLevel' => fn ($logLevel = null) => in_array($logLevel, ['error', 'warn', 'info', 'debug'], true) ? $logLevel : 'warn'
        ],
        'computed' => [
            'keyphrase' => function () {
                return $this->tryResolveQuery($this->keyphrase);
            },
            'synonyms' => function () {
                return $this->tryResolveQuery($this->synonyms);
            },
            'config' => function () {
                /** @var \Kirby\Cms\App */
                $kirby = $this->kirby();
                $config = $kirby->option('johannschopplich.seo-audit', []);

                $defaultConfig = [
                    'proxy' => [
                        'params' => []
                    ]
                ];

                // Merge user configuration with defaults
                $config = array_replace_recursive($defaultConfig, $config);

                // Remove proxy API configuration for the client
                unset($config['proxy']);

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
            },
            'license' => function () {
                $licenses = Licenses::read('johannschopplich/kirby-seo-audit');
                return $licenses->getStatus();
            }
        ],
        'methods' => [
            'tryResolveQuery' => function ($value, $fallback = null) {
                if (is_string($value)) {
                    // Replace all matches of KQL parts with the query results
                    $value = preg_replace_callback('!\{\{(.+?)\}\}!', function ($matches) {
                        $result = $this->model()->query(trim($matches[1]));
                        return $result ?? '';
                    }, $value);
                }

                return $value ?? $fallback;
            }
        ]
    ]
];
