<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use KirbyTools\Licensing\Licenses;
use KirbyTools\Licensing\LicenseUtils;

/**
 * The Zero One edition ships without the licensing package and replaces this
 * class.
 */
final class Licensing
{
    public const PACKAGE_NAME = 'johannschopplich/kirby-seo-audit';

    public static function status(): string
    {
        return Licenses::read(self::PACKAGE_NAME)->getStatus();
    }

    public static function dialog(): string
    {
        return LicenseUtils::toActivationDialog(self::PACKAGE_NAME);
    }
}
