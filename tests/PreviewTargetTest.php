<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\PreviewTarget;
use Kirby\Cms\App;
use Kirby\Cms\Find;
use Kirby\Exception\InvalidArgumentException;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class PreviewTargetTest extends TestCase
{
    protected function tearDown(): void
    {
        App::destroy();
    }

    private static function bootApp(array $props = []): App
    {
        $app = new App(array_replace_recursive([
            'roots' => ['index' => __DIR__ . '/tmp'],
            'urls' => ['index' => 'https://example.com'],
            'blueprints' => [
                'pages/external' => [
                    'title' => 'External',
                    'options' => ['preview' => 'https://preview.example/{{ page.slug }}']
                ]
            ],
            'site' => [
                'children' => [
                    ['slug' => 'home', 'num' => 1],
                    ['slug' => 'test', 'num' => 1],
                    ['slug' => 'external', 'num' => 1, 'template' => 'external']
                ],
                'files' => [
                    ['filename' => 'image.jpg']
                ]
            ],
            'users' => [
                ['id' => 'editor', 'email' => 'editor@example.com', 'role' => 'admin']
            ]
        ], $props));

        $app->impersonate('kirby');

        return $app;
    }

    #[Test]
    public function resolve_returns_the_published_url_by_default(): void
    {
        self::bootApp();

        $this->assertSame(
            ['url' => 'https://example.com/test', 'version' => 'latest'],
            PreviewTarget::resolve(Find::parent('pages/test'))
        );
    }

    #[Test]
    public function resolve_returns_a_token_url_for_the_changes_of_a_page(): void
    {
        self::bootApp();

        ['url' => $url, 'version' => $version] = PreviewTarget::resolve(Find::parent('pages/test'), 'changes');

        $this->assertStringStartsWith('https://example.com/test?', $url);
        $this->assertStringContainsString('_token=', $url);
        $this->assertStringContainsString('_version=changes', $url);
        $this->assertSame('changes', $version);
    }

    #[Test]
    public function resolve_returns_a_token_url_for_the_changes_of_the_site(): void
    {
        self::bootApp();

        ['url' => $url, 'version' => $version] = PreviewTarget::resolve(Find::parent('site'), 'changes');

        $this->assertStringContainsString('_version=changes', $url);
        $this->assertSame('changes', $version);
    }

    #[Test]
    public function resolve_hands_the_changes_token_to_a_custom_preview_url(): void
    {
        self::bootApp();

        ['url' => $url, 'version' => $version] = PreviewTarget::resolve(Find::parent('pages/external'), 'changes');

        $this->assertStringStartsWith('https://preview.example/external?', $url);
        $this->assertStringContainsString('_version=changes', $url);
        $this->assertSame('changes', $version);
    }

    #[Test]
    public function resolve_keeps_a_file_on_the_published_version(): void
    {
        self::bootApp();

        ['url' => $url, 'version' => $version] = PreviewTarget::resolve(Find::parent('site/files/image.jpg'), 'changes');

        $this->assertStringEndsWith('/image.jpg', $url);
        $this->assertSame('latest', $version);
    }

    #[Test]
    public function resolve_returns_a_null_url_when_the_preview_is_disabled(): void
    {
        // The `kirby` user bypasses blueprint options, so a real user is needed.
        self::bootApp([
            'blueprints' => [
                'pages/external' => ['options' => ['preview' => false]]
            ]
        ])->impersonate('editor@example.com');

        $this->assertSame(
            ['url' => null, 'version' => 'latest'],
            PreviewTarget::resolve(Find::parent('pages/external'), 'changes')
        );
    }

    #[Test]
    public function resolve_throws_for_an_unknown_version(): void
    {
        self::bootApp();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown content version: draft');

        PreviewTarget::resolve(Find::parent('pages/test'), 'draft');
    }

    #[Test]
    public function resolve_throws_for_a_model_type_that_cannot_be_previewed(): void
    {
        self::bootApp();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Model cannot be analyzed:');

        PreviewTarget::resolve(Find::parent('users/editor'));
    }
}
