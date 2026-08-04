<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\Proxy;
use Kirby\Cms\App;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\NotFoundException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class ProxyTest extends TestCase
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
            'site' => [
                'children' => [
                    // The site previews its home page, so it needs one
                    ['slug' => 'home', 'num' => 1],
                    ['slug' => 'test', 'num' => 1]
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
    public function resolves_a_page_path_to_its_own_preview_url(): void
    {
        $kirby = self::bootApp();

        $this->assertSame(
            'https://example.com/test',
            (new Proxy($kirby))->resolveUrl('pages/test')
        );
    }

    #[Test]
    public function resolves_the_site_path_to_the_site_preview_url(): void
    {
        $kirby = self::bootApp();

        $this->assertSame(
            'https://example.com',
            (new Proxy($kirby))->resolveUrl('site')
        );
    }

    #[Test]
    public function throws_for_a_model_that_has_no_preview(): void
    {
        $kirby = self::bootApp();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Model cannot be analyzed:');

        (new Proxy($kirby))->resolveUrl('users/editor');
    }

    #[Test]
    public function throws_when_the_model_has_no_preview_url(): void
    {
        // A model whose preview is unavailable yields `null`, which would
        // otherwise reach `Remote` as the URL to fetch
        $kirby = new App([
            'roots' => ['index' => __DIR__ . '/tmp'],
            'urls' => ['index' => 'https://example.com']
        ]);
        $kirby->impersonate('kirby');

        $this->expectException(NotFoundException::class);
        $this->expectExceptionMessage('Model has no preview URL: site');

        (new Proxy($kirby))->resolveUrl('site');
    }

    #[Test]
    public function throws_for_a_page_that_does_not_exist(): void
    {
        $kirby = self::bootApp();

        $this->expectException(NotFoundException::class);

        (new Proxy($kirby))->resolveUrl('pages/nope');
    }

    #[Test]
    public function applies_the_configured_url_resolver(): void
    {
        $kirby = self::bootApp([
            'options' => [
                'johannschopplich.seo-audit' => [
                    'proxy' => [
                        'urlResolver' => fn (string $url) => str_replace(
                            'example.com',
                            'host.docker.internal:3000',
                            $url
                        )
                    ]
                ]
            ]
        ]);

        $this->assertSame(
            'https://host.docker.internal:3000/test',
            (new Proxy($kirby))->resolveUrl('pages/test')
        );
    }

    /** @return array<string, array{0: mixed}> */
    public static function unusableResolverResults(): array
    {
        return [
            'null' => [null],
            'empty string' => [''],
            'non-string' => [['https://example.com']]
        ];
    }

    #[Test]
    #[DataProvider('unusableResolverResults')]
    public function throws_when_the_url_resolver_returns_no_usable_url(mixed $result): void
    {
        $kirby = self::bootApp([
            'options' => [
                'johannschopplich.seo-audit' => [
                    'proxy' => ['urlResolver' => fn () => $result]
                ]
            ]
        ]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('`proxy.urlResolver`');

        (new Proxy($kirby))->resolveUrl('pages/test');
    }

    #[Test]
    public function ignores_a_url_supplied_by_the_request(): void
    {
        // The route used to fetch whatever `url` the request carried, which
        // turned any Panel account into an open proxy onto the server's network
        $kirby = self::bootApp([
            'request' => [
                'method' => 'POST',
                'body' => ['url' => 'http://169.254.169.254/latest/meta-data/']
            ]
        ]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing model path');

        (new Proxy($kirby))->handle();
    }
}
