<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Cms\App;

final class PanelContext
{
    /**
     * Builds the plugin configuration the Panel receives.
     *
     * Every key is listed explicitly, so an option never reaches the browser
     * unless the Panel reads it. The `proxy` option in particular carries
     * closures and whatever credentials its `params` were given.
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
