<?php

use Kirby\Cms\App;
use Kirby\Form\Field\DisplayField;

/**
 * Backs the Vue field the playground build registers, which prints the
 * blueprint for the options toggled on the playground's site view.
 */
final class PlaygroundBlueprintCodeField extends DisplayField
{
}

App::plugin('johannschopplich/seo-audit-playground', [
    'fields' => [
        'playground-blueprint-code' => PlaygroundBlueprintCodeField::class
    ]
]);
