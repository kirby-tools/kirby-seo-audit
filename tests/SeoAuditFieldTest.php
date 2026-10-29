<?php

declare(strict_types = 1);

use Kirby\Cms\App;
use Kirby\Form\Field;
use Kirby\Form\Form;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class SeoAuditFieldTest extends ApiRouteTestCase
{
    #[Test]
    public function toArray_templates_the_keyphrase_and_a_synonyms_string_and_exports_the_field_options(): void
    {
        $props = $this->formField($this->appWithField([
            'keyphrase' => '{{ page.title }}',
            'keyphraseField' => 'metaKeyphrase',
            'synonyms' => '{{ page.slug }}',
            'synonymsField' => 'metaSynonyms',
            'analyzeOn' => 'publish',
            'logLevel' => 'debug'
        ]))->toArray();

        $expected = [
            'analyzeOn' => 'publish',
            'keyphrase' => 'Analyzing Kirby',
            'keyphraseField' => 'metaKeyphrase',
            'licenseDialog' => 'johannschopplich-kirby-seo-audit/activate',
            'licenseStatus' => 'inactive',
            'logLevel' => 'debug',
            'synonyms' => 'test',
            'synonymsField' => 'metaSynonyms'
        ];

        $this->assertSame($expected, array_intersect_key($props, $expected));
    }

    #[Test]
    public function toArray_keeps_a_synonyms_list_verbatim_and_omits_an_unset_analyzeOn(): void
    {
        $props = $this->formField($this->appWithField([
            'synonyms' => ['{{ page.slug }}']
        ]))->toArray();

        $this->assertSame(['{{ page.slug }}'], $props['synonyms']);
        $this->assertArrayNotHasKey('analyzeOn', $props);
    }

    #[Test]
    public function label_falls_back_to_the_plugin_translation_unless_the_blueprint_sets_one(): void
    {
        $this->assertSame('SEO Audit', $this->formField($this->appWithField())->label());
        $this->assertSame('Search', $this->formField($this->appWithField(['label' => 'Search']))->label());
    }

    #[Test]
    public function an_unknown_logLevel_turns_the_field_into_an_error_field(): void
    {
        $props = $this->formField($this->appWithField(['logLevel' => 'nope']))->toArray();

        $this->assertSame('info', $props['type']);
        $this->assertSame('negative', $props['theme']);
    }

    private function appWithField(array $field = []): App
    {
        return self::bootApp([
            'blueprints' => [
                'pages/article' => [
                    'title' => 'Article',
                    'fields' => [
                        'seo' => ['type' => 'seo-audit', ...$field]
                    ]
                ]
            ],
            'site' => [
                'children' => [
                    [
                        'slug' => 'test',
                        'template' => 'article',
                        'content' => ['title' => 'Analyzing Kirby']
                    ]
                ]
            ]
        ]);
    }

    private function formField(App $app): Field
    {
        return Form::for($app->page('test'))->field('seo');
    }
}
