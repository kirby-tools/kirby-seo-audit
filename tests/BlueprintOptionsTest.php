<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\BlueprintOptions;
use Kirby\Cms\App;
use Kirby\Cms\Page;
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

    private static function articlePage(array|false|null $buttons = null): Page
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

        return $app->page('test');
    }

    #[Test]
    public function for_view_button_resolves_the_keyphrase_query(): void
    {
        $page = self::articlePage([
            'seo-audit' => ['keyphrase' => '{{ page.title }}']
        ]);

        $this->assertSame(
            'Analyzing Kirby',
            BlueprintOptions::forViewButton($page)['keyphrase']
        );
    }

    #[Test]
    public function for_view_button_resolves_the_synonyms_query(): void
    {
        $page = self::articlePage([
            'seo-audit' => ['synonyms' => '{{ page.slug }}']
        ]);

        $this->assertSame(
            'test',
            BlueprintOptions::forViewButton($page)['synonyms']
        );
    }

    #[Test]
    public function for_view_button_reads_props_nested_under_props(): void
    {
        $page = self::articlePage([
            'seo-audit' => [
                'component' => 'k-seo-audit-view-button',
                'props' => ['keyphrase' => '{{ page.title }}']
            ]
        ]);

        $this->assertSame(
            'Analyzing Kirby',
            BlueprintOptions::forViewButton($page)['keyphrase']
        );
    }

    #[Test]
    public function for_view_button_returns_null_for_a_button_listed_without_props(): void
    {
        $page = self::articlePage(['preview', 'seo-audit']);

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }

    #[Test]
    public function for_view_button_returns_null_for_a_button_switched_off_by_name(): void
    {
        $page = self::articlePage(['seo-audit' => false]);

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }

    #[Test]
    public function for_view_button_returns_null_for_a_blueprint_without_buttons(): void
    {
        $page = self::articlePage();

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }

    #[Test]
    public function for_view_button_returns_null_when_the_buttons_are_switched_off(): void
    {
        $page = self::articlePage(false);

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            BlueprintOptions::forViewButton($page)
        );
    }
}
