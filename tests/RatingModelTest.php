<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\Rating;
use JohannSchopplich\SeoAudit\RatingStore;
use Kirby\Cms\Page;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class RatingModelTest extends ApiRouteTestCase
{
    private const COUNTS = ['good' => 1, 'ok' => 1, 'bad' => 1];
    private const APP_PROPS = [
        'site' => [
            'children' => [
                ['slug' => 'a', 'num' => 1, 'content' => ['title' => 'A']],
                ['slug' => 'b', 'num' => 2, 'content' => ['title' => 'B']],
                ['slug' => 'c', 'num' => 3, 'content' => ['title' => 'C']]
            ]
        ]
    ];

    #[Test]
    public function page_seo_audit_rating_returns_the_stored_rating(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        (new RatingStore($app))->write($app->page('a'), 'ok', 'good', self::COUNTS, 'latest');

        $rating = $app->page('a')->seoAuditRating();

        $this->assertInstanceOf(Rating::class, $rating);
        $this->assertSame('ok', (string)$rating);
        $this->assertSame('ok', $rating->seo());
        $this->assertSame('', (string)$app->page('b')->seoAuditRating());
    }

    #[Test]
    public function site_seo_audit_rating_returns_the_stored_rating(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        (new RatingStore($app))->write($app->site(), 'good', 'good', self::COUNTS, 'latest');

        $this->assertSame('good', (string)$app->site()->seoAuditRating());
    }

    #[Test]
    public function sort_by_seoauditscore_puts_unrated_and_bad_pages_first(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $store->write($app->page('a'), 'good', 'good', self::COUNTS, 'latest');
        $store->write($app->page('b'), 'bad', 'ok', self::COUNTS, 'latest');

        $sorted = $app->site()->children()->sortBy('seoAuditScore', 'asc');

        $this->assertSame(['c', 'b', 'a'], $sorted->keys());
        $this->assertSame(0, $app->page('c')->seoauditscore());
    }

    #[Test]
    public function the_rating_reads_as_a_field_in_queries(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        (new RatingStore($app))->write($app->page('a'), 'good', 'bad', self::COUNTS, 'latest');

        $this->assertSame('bad', $app->page('a')->toString('{{ page.seoAuditRating }}'));
        $this->assertSame('', $app->page('b')->toString('{{ page.seoAuditRating }}'));
    }

    #[Test]
    public function deleting_a_page_removes_its_rating(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $store->write($page, 'good', 'good', self::COUNTS, 'latest');
        $this->assertTrue($store->read($page)->isRated());

        $page->delete();

        $this->assertFalse($store->read($page)->isRated());
    }
}
