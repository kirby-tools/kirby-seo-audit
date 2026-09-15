<?php

declare(strict_types = 1);

use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\NotFoundException;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class PreviewUrlRouteTest extends ApiRouteTestCase
{
    private function callPreviewUrlRoute(
        array $query,
        string $user = 'admin@example.com'
    ): mixed {
        $app = self::bootApp([
            'blueprints' => [
                'pages/no-preview' => [
                    'title' => 'No preview',
                    'options' => ['preview' => false]
                ]
            ],
            'site' => [
                'children' => [
                    ['slug' => 'home', 'num' => 1],
                    ['slug' => 'test', 'num' => 1],
                    ['slug' => 'no-preview', 'num' => 1, 'template' => 'no-preview']
                ]
            ],
            'users' => [
                ['id' => 'admin', 'email' => 'admin@example.com', 'role' => 'admin'],
                ['id' => 'editor', 'email' => 'editor@example.com', 'role' => 'editor']
            ],
            'roles' => [
                ['name' => 'admin', 'title' => 'Admin'],
                [
                    'name' => 'editor',
                    'title' => 'Editor',
                    'permissions' => ['pages' => ['access' => false]]
                ]
            ],
            'request' => ['query' => $query]
        ]);

        $app->impersonate($user);

        return $this->callRoute($app, '__seo-audit__/preview-url');
    }

    #[Test]
    public function returns_the_published_url_without_a_version(): void
    {
        $this->assertSame(
            ['url' => 'https://example.com/test', 'version' => 'latest'],
            $this->callPreviewUrlRoute(['path' => 'pages/test'])
        );
    }

    #[Test]
    public function returns_the_changes_url_for_the_changes_version(): void
    {
        $response = $this->callPreviewUrlRoute(['path' => 'pages/test', 'version' => 'changes']);

        $this->assertStringContainsString('_version=changes', $response['url']);
        $this->assertSame('changes', $response['version']);
    }

    #[Test]
    public function returns_a_null_url_for_a_disabled_preview(): void
    {
        $this->assertSame(
            ['url' => null, 'version' => 'latest'],
            $this->callPreviewUrlRoute(['path' => 'pages/no-preview', 'version' => 'changes'])
        );
    }

    #[Test]
    public function throws_without_a_path(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing model path');

        $this->callPreviewUrlRoute([]);
    }

    #[Test]
    public function hides_a_page_the_user_cannot_access(): void
    {
        $this->expectException(NotFoundException::class);

        $this->callPreviewUrlRoute(['path' => 'pages/test'], user: 'editor@example.com');
    }
}
