<?php

use JohannSchopplich\KirbyTools\QueryResolver;
use Kirby\Toolkit\I18n;

return [
    'seo-audit' => [
        'props' => [
            'label' => fn ($label = null) => I18n::translate($label, $label),
            'keyphrase' => fn ($keyphrase = null) => $keyphrase,
            'keyphraseField' => fn ($keyphraseField = null) => is_string($keyphraseField) ? $keyphraseField : null,
            'synonyms' => fn ($synonyms = null) => $synonyms,
            'synonymsField' => fn ($synonymsField = null) => is_string($synonymsField) ? $synonymsField : null,
            'assessments' => fn ($assessments = []) => is_array($assessments) ? $assessments : [],
            'contentSelector' => fn ($contentSelector = null) => is_string($contentSelector) ? $contentSelector : 'body',
            'links' => fn ($links = true) => $links !== false,
            'persisted' => fn ($persisted = true) => $persisted !== false,
            'logLevel' => fn ($logLevel = null) => in_array($logLevel, ['error', 'warn', 'info', 'debug'], true) ? $logLevel : null
        ],
        'computed' => [
            'keyphrase' => function () {
                return $this->tryResolveQuery($this->keyphrase);
            },
            'synonyms' => function () {
                return $this->tryResolveQuery($this->synonyms);
            }
        ],
        'methods' => [
            'tryResolveQuery' => function ($value, $fallback = null) {
                return QueryResolver::resolve($this->model(), $value, $fallback);
            }
        ]
    ]
];
