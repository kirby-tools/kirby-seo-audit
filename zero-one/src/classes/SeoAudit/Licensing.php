<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

final class Licensing
{
    public static function status(): string
    {
        return 'active';
    }

    public static function dialog(): string
    {
        return '';
    }
}
