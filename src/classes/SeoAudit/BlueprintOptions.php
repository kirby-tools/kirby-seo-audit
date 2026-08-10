<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Cms\ModelWithContent;

/**
 * Resolves the blueprint options that need the model behind them.
 */
final class BlueprintOptions
{
    private const BUTTON_NAME = 'seo-audit';

    /**
     * Replaces each `{{ ... }}` placeholder with the result of its Kirby query
     * against the model.
     */
    public static function resolveQuery(
        ModelWithContent $model,
        mixed $value,
        mixed $fallback = null
    ): mixed {
        if (is_string($value)) {
            $value = preg_replace_callback(
                '!\{\{(.+?)\}\}!',
                fn ($matches) => $model->query(trim($matches[1])) ?? '',
                $value
            );
        }

        return $value ?? $fallback;
    }

    /**
     * Resolves the queries in the view button's blueprint props.
     *
     * A section computes its props on the server, a view button does not:
     * `Kirby\Panel\Ui\Component::props()` hands custom attributes to the Panel
     * verbatim. The button therefore asks for its own props by model, and the
     * query never travels through the request.
     *
     * @return array{keyphrase: mixed, synonyms: mixed}
     */
    public static function forViewButton(ModelWithContent $model): array
    {
        $props = self::viewButtonProps($model);

        return [
            'keyphrase' => self::resolveQuery($model, $props['keyphrase'] ?? null),
            'synonyms' => self::resolveQuery($model, $props['synonyms'] ?? null)
        ];
    }

    private static function viewButtonProps(ModelWithContent $model): array
    {
        $buttons = $model->blueprint()->buttons();

        if (!is_array($buttons)) {
            return [];
        }

        $button = $buttons[self::BUTTON_NAME] ?? null;

        if (!is_array($button)) {
            return [];
        }

        // Kirby takes props either at the top level or nested under `props`.
        return $button['props'] ?? $button;
    }
}
