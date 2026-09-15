<?php

declare(strict_types = 1);

use JohannSchopplich\SeoAudit\RatingStore;
use Kirby\Cms\Page;
use Kirby\Exception\InvalidArgumentException;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class RatingStoreTest extends ApiRouteTestCase
{
    private const COUNTS = ['good' => 5, 'ok' => 1, 'bad' => 2];
    private const APP_PROPS = [
        'site' => [
            'content' => ['title' => 'Site'],
            'children' => [
                ['slug' => 'home', 'num' => 1],
                [
                    'slug' => 'test',
                    'num' => 1,
                    'content' => ['title' => 'Test', 'uuid' => 'test-uuid']
                ]
            ]
        ]
    ];

    #[Test]
    public function read_returns_unrated_for_an_unanalyzed_page(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $rating = (new RatingStore($app))->read($app->page('test'));

        $this->assertFalse($rating->isRated());
        $this->assertSame('', (string)$rating);
        $this->assertSame(0, $rating->score());
        $this->assertSame('', $rating->seo());
        $this->assertFalse($rating->isStale());
        $this->assertNull($rating->timestamp());
    }

    #[Test]
    public function write_then_read_returns_the_stored_rating(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = $app->page('test');

        $writtenRating = $store->write($page, 'good', 'ok', self::COUNTS, 'changes');
        $readRating = $store->read($page);

        $this->assertSame($writtenRating->toArray(), $readRating->toArray());
        $this->assertSame('ok', $readRating->rating());
        $this->assertSame(2, $readRating->score());
        $this->assertSame('good', $readRating->seo());
        $this->assertSame('ok', $readRating->readability());
        $this->assertSame(self::COUNTS, $readRating->counts());
        $this->assertSame('changes', $readRating->version());
        $this->assertEqualsWithDelta(time(), $readRating->timestamp(), 2);
        $this->assertFalse($readRating->isStale());
    }

    #[Test]
    public function rating_returns_the_worse_of_the_two_lights(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = $app->page('test');

        $this->assertSame('bad', (string)$store->write($page, 'good', 'bad', self::COUNTS, 'latest'));
        $this->assertSame('good', (string)$store->write($page, 'good', 'good', self::COUNTS, 'latest'));
        $this->assertSame(3, $store->read($page)->score());
    }

    #[Test]
    public function a_category_without_a_light_does_not_count(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = $app->page('test');

        // A page without a keyphrase has no SEO light, only readability.
        $rating = $store->write($page, 'none', 'good', self::COUNTS, 'latest');

        $this->assertSame('good', (string)$rating);
        $this->assertSame('none', $rating->seo());
    }

    #[Test]
    public function the_site_has_its_own_rating(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);

        $store->write($app->site(), 'bad', 'bad', self::COUNTS, 'latest');

        $this->assertSame('bad', (string)$store->read($app->site()));
        $this->assertSame('', (string)$store->read($app->page('test')));
    }

    #[Test]
    public function write_keeps_a_rating_per_language(): void
    {
        $app = self::bootApp([
            ...self::APP_PROPS,
            'languages' => [
                ['code' => 'en', 'name' => 'English', 'default' => true],
                ['code' => 'de', 'name' => 'Deutsch']
            ]
        ]);
        $store = new RatingStore($app);
        $page = $app->page('test');

        $store->write($page, 'good', 'good', self::COUNTS, 'latest', 'de');

        $this->assertSame('good', (string)$store->read($page, 'de'));
        $this->assertSame('', (string)$store->read($page, 'en'));
        $this->assertSame('', (string)$store->read($page));
    }

    #[Test]
    public function a_rating_goes_stale_when_the_content_changes_afterwards(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $this->assertFalse($store->write($page, 'good', 'good', self::COUNTS, 'latest')->isStale());

        // A rating carries the second it was written, so within this test a
        // newer change to the content lies in the future.
        touch($page->version('latest')->contentFile(), time() + 60);

        $this->assertTrue($store->read($page)->isStale());
    }

    #[Test]
    public function read_returns_a_fresh_rating_when_the_content_changed_in_the_same_second(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $rating = $store->write($page, 'good', 'good', self::COUNTS, 'latest');
        touch($page->version('latest')->contentFile(), $rating->timestamp());

        $this->assertFalse($store->read($page)->isStale());
    }

    #[Test]
    public function read_finds_the_rating_after_a_slug_change(): void
    {
        $app = self::bootApp(self::APP_PROPS);
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $store->write($page, 'good', 'good', self::COUNTS, 'latest');

        $this->assertSame('good', (string)$store->read($page->changeSlug('renamed')));
    }

    #[Test]
    public function read_loses_the_rating_of_a_page_without_uuid_after_a_slug_change(): void
    {
        $app = self::bootApp([
            ...self::APP_PROPS,
            'options' => ['content' => ['uuid' => false]]
        ]);
        $store = new RatingStore($app);
        $page = Page::create(['slug' => 'temp', 'template' => 'default']);

        $store->write($page, 'good', 'good', self::COUNTS, 'latest');

        $this->assertTrue($store->read($page)->isRated());
        $this->assertFalse($store->read($page->changeSlug('renamed'))->isRated());
    }

    #[Test]
    public function remove_drops_the_ratings_of_every_language(): void
    {
        $app = self::bootApp([
            ...self::APP_PROPS,
            'languages' => [
                ['code' => 'en', 'name' => 'English', 'default' => true],
                ['code' => 'de', 'name' => 'Deutsch']
            ]
        ]);
        $store = new RatingStore($app);
        $page = $app->page('test');

        $store->write($page, 'good', 'good', self::COUNTS, 'latest', 'en');
        $store->write($page, 'bad', 'bad', self::COUNTS, 'latest', 'de');
        $store->remove($page);

        $this->assertFalse($store->read($page, 'en')->isRated());
        $this->assertFalse($store->read($page, 'de')->isRated());
    }

    #[Test]
    public function write_rejects_an_unknown_seo_light(): void
    {
        $app = self::bootApp(self::APP_PROPS);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid seo rating');

        (new RatingStore($app))->write($app->page('test'), 'great', 'good', self::COUNTS, 'latest');
    }

    #[Test]
    public function write_rejects_a_non_integer_count(): void
    {
        $app = self::bootApp(self::APP_PROPS);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid rating count for bad');

        (new RatingStore($app))->write($app->page('test'), 'good', 'good', ['good' => 1, 'ok' => 0, 'bad' => '2'], 'latest');
    }

    #[Test]
    public function write_rejects_an_unknown_version(): void
    {
        $app = self::bootApp(self::APP_PROPS);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown content version');

        (new RatingStore($app))->write($app->page('test'), 'good', 'good', self::COUNTS, 'draft');
    }
}
