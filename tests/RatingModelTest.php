<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\Rating;
use JohannSchopplich\SeoAudit\RatingStore;
use Kirby\Cms\App;
use Kirby\Cms\Page;
use Kirby\Filesystem\Dir;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class RatingModelTest extends TestCase
{
    private const COUNTS = ['good' => 1, 'ok' => 1, 'bad' => 1];
    private const ROOT = __DIR__ . '/tmp/rating-model';

    protected function setUp(): void
    {
        Dir::make(self::ROOT . '/content');
    }

    protected function tearDown(): void
    {
        App::destroy();
        Dir::remove(self::ROOT);
    }

    private static function bootApp(): App
    {
        $app = new App([
            'roots' => ['index' => self::ROOT],
            'urls' => ['index' => 'https://example.com'],
            'options' => [
                'johannschopplich.seo-audit' => [
                    'cache' => ['type' => 'memory']
                ]
            ],
            'site' => [
                'children' => [
                    ['slug' => 'a', 'num' => 1, 'content' => ['title' => 'A']],
                    ['slug' => 'b', 'num' => 2, 'content' => ['title' => 'B']],
                    ['slug' => 'c', 'num' => 3, 'content' => ['title' => 'C']]
                ]
            ]
        ]);

        $app->impersonate('kirby');

        return $app;
    }

    #[Test]
    public function page_seo_audit_rating_returns_the_stored_rating(): void
    {
        $app = self::bootApp();
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
        $app = self::bootApp();
        (new RatingStore($app))->write($app->site(), 'good', 'good', self::COUNTS, 'latest');

        $this->assertSame('good', (string)$app->site()->seoAuditRating());
    }

    #[Test]
    public function sort_by_seoauditscore_puts_unrated_and_bad_pages_first(): void
    {
        $app = self::bootApp();
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
        $app = self::bootApp();
        (new RatingStore($app))->write($app->page('a'), 'good', 'bad', self::COUNTS, 'latest');

        $this->assertSame('bad', $app->page('a')->toString('{{ page.seoAuditRating }}'));
        $this->assertSame('', $app->page('b')->toString('{{ page.seoAuditRating }}'));
    }

    #[Test]
    public function deleting_a_page_removes_its_rating(): void
    {
        $app = self::bootApp();
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $store->write($page, 'good', 'good', self::COUNTS, 'latest');
        $this->assertTrue($store->read($page)->isRated());

        $page->delete();

        $this->assertFalse($store->read($page)->isRated());
    }
}
