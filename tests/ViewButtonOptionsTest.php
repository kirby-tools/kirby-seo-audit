<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\ViewButtonOptions;
use Kirby\Cms\App;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class ViewButtonOptionsTest extends TestCase
{
    protected function tearDown(): void
    {
        App::destroy();
    }

    private function appWithButtons(array|false|null $buttons = null): App
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
    public function resolves_the_keyphrase_query(): void
    {
        $page = $this->appWithButtons([
            'seo-audit' => ['keyphrase' => '{{ page.title }}']
        ])->page('test');

        $this->assertSame(
            'Analyzing Kirby',
            ViewButtonOptions::resolve($page)['keyphrase']
        );
    }

    #[Test]
    public function resolves_the_synonyms_query(): void
    {
        $page = $this->appWithButtons([
            'seo-audit' => ['synonyms' => '{{ page.slug }}']
        ])->page('test');

        $this->assertSame(
            'test',
            ViewButtonOptions::resolve($page)['synonyms']
        );
    }

    #[Test]
    public function reads_props_nested_under_props(): void
    {
        $page = $this->appWithButtons([
            'seo-audit' => [
                'component' => 'k-seo-audit-view-button',
                'props' => ['keyphrase' => '{{ page.title }}']
            ]
        ])->page('test');

        $this->assertSame(
            'Analyzing Kirby',
            ViewButtonOptions::resolve($page)['keyphrase']
        );
    }

    #[Test]
    public function prefers_a_top_level_prop_over_the_same_key_under_props(): void
    {
        $page = $this->appWithButtons([
            'seo-audit' => [
                'keyphrase' => 'developers',
                'props' => ['keyphrase' => '{{ page.title }}']
            ]
        ])->page('test');

        $this->assertSame(
            'developers',
            ViewButtonOptions::resolve($page)['keyphrase']
        );
    }

    #[Test]
    public function returns_null_for_a_button_listed_without_props(): void
    {
        $page = $this->appWithButtons(['preview', 'seo-audit'])->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            ViewButtonOptions::resolve($page)
        );
    }

    #[Test]
    public function returns_null_for_a_button_set_to_false(): void
    {
        $page = $this->appWithButtons(['seo-audit' => false])->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            ViewButtonOptions::resolve($page)
        );
    }

    #[Test]
    public function returns_null_for_a_blueprint_without_buttons(): void
    {
        $page = $this->appWithButtons()->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            ViewButtonOptions::resolve($page)
        );
    }

    #[Test]
    public function returns_null_when_buttons_is_false(): void
    {
        $page = $this->appWithButtons(false)->page('test');

        $this->assertSame(
            ['keyphrase' => null, 'synonyms' => null],
            ViewButtonOptions::resolve($page)
        );
    }
}
