<?php

declare(strict_types = 1);

use Kirby\Cms\App;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\NotFoundException;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class ButtonOptionsRouteTest extends ApiRouteTestCase
{
    private function callButtonOptionsRoute(
        array $query,
        string $user = 'admin@example.com'
    ): mixed {
        $app = new App([
            'roots' => ['index' => __DIR__ . '/tmp'],
            'blueprints' => [
                'pages/article' => [
                    'title' => 'Article',
                    'buttons' => [
                        'seo-audit' => ['keyphrase' => '{{ page.title }}']
                    ]
                ],
                'users/editor' => [
                    'title' => 'Editor',
                    'permissions' => ['access' => ['panel' => true]]
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

        return $this->callRoute($app, '__seo-audit__/button-options');
    }

    #[Test]
    public function resolves_the_keyphrase_query_of_the_requested_page(): void
    {
        $response = $this->callButtonOptionsRoute(['path' => 'pages/test']);

        $this->assertSame(
            ['keyphrase' => 'Analyzing Kirby', 'synonyms' => null],
            $response
        );
    }

    #[Test]
    public function rejects_a_request_without_a_path(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->callButtonOptionsRoute([]);
    }

    #[Test]
    public function rejects_a_request_whose_path_is_empty(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->callButtonOptionsRoute(['path' => '']);
    }

    #[Test]
    public function hides_a_page_the_user_cannot_access(): void
    {
        $this->expectException(NotFoundException::class);

        $this->callButtonOptionsRoute(['path' => 'pages/test'], user: 'editor@example.com');
    }
}
