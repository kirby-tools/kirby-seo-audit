<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\BlueprintOptions;
use Kirby\Cms\App;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class BlueprintOptionsTest extends TestCase
{
    protected function tearDown(): void
    {
        App::destroy();
    }

    private static function bootApp(array|false|null $buttons = null): App
    {
        $app = new App([
            'roots' => ['index' => __DIR__ . '/tmp'],
            'urls' => ['index' => 'https://example.com'],
            'blueprints' => [
                'pages/article' => [
                    'title' => 'Article',
                    'buttons' => $buttons
                ]
            ],
            'site' => [
                'children' => [
                    [
                        'slug' => 'test',
                        'num' => 1,
                        'template' => 'article',
                        'content' => ['title' => 'Analyzing Kirby']
                    ]
                ]
            ]
        ]);

        $app->impersonate('kirby');

        return $app;
    }

    #[Test]
    public function resolve_query_replaces_a_placeholder_with_its_query_result(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            'Analyzing Kirby',
            BlueprintOptions::resolveQuery($page, '{{ page.title }}')
        );
    }

    #[Test]
    public function resolve_query_replaces_every_placeholder_in_one_value(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            'Analyzing Kirby – test',
            BlueprintOptions::resolveQuery($page, '{{ page.title }} – {{ page.slug }}')
        );
    }

    #[Test]
    public function resolve_query_empties_a_placeholder_that_resolves_to_null(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            '',
            BlueprintOptions::resolveQuery($page, '{{ page.nonexistentField }}')
        );
    }

    #[Test]
    public function resolve_query_leaves_a_value_without_a_placeholder_alone(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            'developers',
            BlueprintOptions::resolveQuery($page, 'developers')
        );
    }

    #[Test]
    public function resolve_query_returns_the_fallback_for_a_null_value(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            'fallback',
            BlueprintOptions::resolveQuery($page, null, 'fallback')
        );
    }

    #[Test]
    public function for_view_button_resolves_the_keyphrase_query(): void
    {
        $page = self::bootApp([
            'seo-audit' => ['keyphrase' => '{{ page.title }}']
        ])->page('test');

        $this->assertSame(
            'Analyzing Kirby',
            BlueprintOptions::forViewButton($page)['keyphrase']
        );
    }

    #[Test]
    public function for_view_button_resolves_the_synonyms_query(): void
    {
        $page = self::bootApp([
            'seo-audit' => ['synonyms' => '{{ page.slug }}']
        ])->page('test');

        $this->assertSame(
            'test',
            BlueprintOptions::forViewButton($page)['synonyms']
        );
    }

    #[Test]
    public function for_view_button_reads_props_nested_under_props(): void
    {
        $page = self::bootApp([
            'seo-audit' => [
                'component' => 'k-seo-audit-view-button',
                'props' => ['keyphrase' => '{{ page.title }}']
            ]
        ])->page('test');

        $this->assertSame(
            'Analyzing Kirby',
            BlueprintOptions::forViewButton($page)['keyphrase']
        );
    }

    #[Test]
    public function for_view_button_returns_null_for_a_button_listed_without_props(): void
    {
        $page = self::bootApp(['preview', 'seo-audit'])->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }

    #[Test]
    public function for_view_button_returns_null_for_a_blueprint_without_buttons(): void
    {
        $page = self::bootApp()->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }

    #[Test]
    public function for_view_button_returns_null_when_the_buttons_are_switched_off(): void
    {
        $page = self::bootApp(false)->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }
}
