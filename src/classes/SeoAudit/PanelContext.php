<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Cms\App;

final class PanelContext
{
    /**
     * Builds the plugin configuration the Panel receives.
     *
     * The `proxy` option carries closures and whatever credentials its
     * `params` were given, so the return lists the one key the Panel reads
     * rather than stripping the keys it must not see.
     *
     * @return array<string, mixed>
     */
    public static function config(): array
    {
        $kirby = App::instance();

        return [
            'auto' => $kirby->option('johannschopplich.seo-audit.auto'),
            'logLevel' => $kirby->option('johannschopplich.seo-audit.logLevel')
        ];
    }
}
