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
        return [
            'logLevel' => App::instance()->option('johannschopplich.seo-audit.logLevel')
        ];
    }
}
