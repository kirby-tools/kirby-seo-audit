<?php

use JohannSchopplich\SeoAudit\RatingStore;
use Kirby\Cms\App;
use Kirby\Cms\Event;
use Kirby\Cms\Page;

return [
    // A rating outlives every edit, so only a deleted page loses it.
    'page.delete:after' => function (Event $event) {
        $store = new RatingStore(App::instance());

        foreach ($event->arguments() as $argument) {
            if ($argument instanceof Page) {
                $store->remove($argument);
            }
        }
    }
];
