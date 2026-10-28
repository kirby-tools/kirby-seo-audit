<?php

declare(strict_types = 1);

namespace JohannSchopplich\SeoAudit;

use Kirby\Exception\InvalidArgumentException;
use Kirby\Form\Field\DisplayField;
use Kirby\Reflection\Attributes\Prop;
use Kirby\Toolkit\Str;

final class SeoAuditField extends DisplayField
{
    private const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

    #[Prop(computed: true)]
    protected string|null $keyphrase = null;

    #[Prop]
    protected string|null $keyphraseField = null;

    #[Prop(computed: true)]
    protected array|string|null $synonyms = null;

    #[Prop]
    protected string|null $synonymsField = null;

    #[Prop]
    protected array $assessments = [];

    #[Prop]
    protected string $contentSelector = 'body';

    #[Prop]
    protected bool $links = true;

    #[Prop]
    protected bool $persisted = true;

    /**
     * `null` falls back to the global `analyzeOn` option.
     */
    #[Prop]
    protected string|bool|null $analyzeOn = null;

    #[Prop(computed: true)]
    protected string|null $logLevel = null;

    #[Prop(computed: true)]
    protected string $licenseStatus = 'inactive';

    #[Prop(computed: true)]
    protected string $licenseDialog = '';

    public function label(): string
    {
        // The blueprint normalizer sets the label to `Str::label()` of the key when
        // none is given, so that value counts as unset.
        if ($this->label === null || $this->label === Str::label($this->name ?? '')) {
            return $this->i18n('johannschopplich.seo-audit.label');
        }

        return parent::label();
    }

    public function keyphrase(): string|null
    {
        return $this->stringTemplate($this->keyphrase, safe: false);
    }

    public function synonyms(): array|string|null
    {
        if (is_string($this->synonyms)) {
            return $this->stringTemplate($this->synonyms, safe: false);
        }

        return $this->synonyms;
    }

    public function logLevel(): string|null
    {
        if ($this->logLevel !== null && !in_array($this->logLevel, self::LOG_LEVELS, true)) {
            throw new InvalidArgumentException(
                message: 'Invalid log level "' . $this->logLevel . '", expected one of: ' . implode(', ', self::LOG_LEVELS)
            );
        }

        return $this->logLevel;
    }

    public function licenseStatus(): string
    {
        return Licensing::status();
    }

    public function licenseDialog(): string
    {
        return Licensing::dialog();
    }
}
