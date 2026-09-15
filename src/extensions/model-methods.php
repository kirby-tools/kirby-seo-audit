<?php

use JohannSchopplich\SeoAudit\Rating;
use JohannSchopplich\SeoAudit\RatingStore;

$rating = function (): Rating {
    return (new RatingStore($this->kirby()))->read($this);
};

return [
    'pageMethods' => [
        'seoAuditRating' => $rating,
        // `sortBy` lowercases its field name, so the score answers to one.
        'seoauditscore' => function (): int {
            return $this->seoAuditRating()->score();
        }
    ],
    'siteMethods' => [
        'seoAuditRating' => $rating
    ]
];
