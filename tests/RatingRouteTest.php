<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\RatingStore;
use Kirby\Cms\App;
use Kirby\Exception\InvalidArgumentException;
use Kirby\Exception\NotFoundException;
use Kirby\Exception\PermissionException;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class RatingRouteTest extends ApiRouteTestCase
{
    private const OUTCOME = [
        'seo' => 'good',
        'readability' => 'bad',
        'counts' => ['good' => 4, 'ok' => 0, 'bad' => 1],
        'version' => 'latest'
    ];

    private const APP_PROPS = [
        'site' => [
            'children' => [
                ['slug' => 'home', 'num' => 1],
                ['slug' => 'test', 'num' => 1, 'content' => ['title' => 'Test']]
            ],
            'files' => [
                ['filename' => 'image.jpg']
            ]
        ],
        'users' => [
            ['id' => 'admin', 'email' => 'admin@example.com', 'role' => 'admin'],
            ['id' => 'editor', 'email' => 'editor@example.com', 'role' => 'editor'],
            ['id' => 'reviewer', 'email' => 'reviewer@example.com', 'role' => 'reviewer']
        ],
        'roles' => [
            ['name' => 'admin', 'title' => 'Admin'],
            [
                'name' => 'editor',
                'title' => 'Editor',
                'permissions' => ['pages' => ['access' => false]]
            ],
            [
                'name' => 'reviewer',
                'title' => 'Reviewer',
                'permissions' => ['pages' => ['update' => false]]
            ]
        ]
    ];

    private function get(array $query, string $user = 'admin@example.com'): mixed
    {
        return $this->callRatingRoute(['query' => $query], $user, 'GET');
    }

    private function post(array $body, string $user = 'admin@example.com'): mixed
    {
        return $this->callRatingRoute(['method' => 'POST', 'body' => $body], $user, 'POST');
    }

    private function callRatingRoute(array $request, string $user, string $method): mixed
    {
        $app = self::bootApp([...self::APP_PROPS, 'request' => $request]);
        $app->impersonate($user);

        return $this->callRoute($app, '__seo-audit__/rating', $method);
    }

    #[Test]
    public function get_returns_unrated_for_an_unanalyzed_page(): void
    {
        $rating = $this->get(['path' => 'pages/test']);

        $this->assertNull($rating['seo']);
        $this->assertNull($rating['timestamp']);
        $this->assertFalse($rating['isStale']);
    }

    #[Test]
    public function post_stores_and_returns_the_rating(): void
    {
        $rating = $this->post(['path' => 'pages/test', ...self::OUTCOME]);

        $this->assertSame('good', $rating['seo']);
        $this->assertSame('bad', $rating['readability']);
        $this->assertSame(self::OUTCOME['counts'], $rating['counts']);
        $this->assertSame('latest', $rating['version']);
        $this->assertEqualsWithDelta(time(), $rating['timestamp'], 2);
        $this->assertFalse($rating['isStale']);

        $this->assertSame('bad', (string)(new RatingStore(App::instance()))->read(App::instance()->page('test')));
    }

    #[Test]
    public function post_stores_the_site_rating(): void
    {
        $rating = $this->post(['path' => 'site', ...self::OUTCOME]);

        $this->assertSame('good', $rating['seo']);
    }

    #[Test]
    public function get_returns_unrated_for_a_file(): void
    {
        $this->assertNull($this->get(['path' => 'site/files/image.jpg'])['timestamp']);
    }

    #[Test]
    public function post_rejects_a_file(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Model has no rating');

        $this->post(['path' => 'site/files/image.jpg', ...self::OUTCOME]);
    }

    #[Test]
    public function post_throws_without_the_update_permission(): void
    {
        $this->expectException(PermissionException::class);

        $this->post(['path' => 'pages/test', ...self::OUTCOME], user: 'reviewer@example.com');
    }

    #[Test]
    public function get_returns_the_rating_without_the_update_permission(): void
    {
        $this->assertFalse($this->get(['path' => 'pages/test'], user: 'reviewer@example.com')['isStale']);
    }

    #[Test]
    public function post_rejects_an_unknown_seo_light(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->post(['path' => 'pages/test', ...self::OUTCOME, 'seo' => 'great']);
    }

    #[Test]
    public function post_throws_without_counts(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid rating counts');

        $this->post(['path' => 'pages/test', 'seo' => 'good', 'readability' => 'bad', 'version' => 'latest']);
    }

    #[Test]
    public function throws_without_a_path(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing model path');

        $this->get([]);
    }

    #[Test]
    public function hides_a_page_the_user_cannot_access(): void
    {
        $this->expectException(NotFoundException::class);

        $this->get(['path' => 'pages/test'], user: 'editor@example.com');
    }
}
