<?php

/** @var \Kirby\Cms\App $kirby */
/** @var \Kirby\Cms\Site $site */
/** @var \Kirby\Cms\Page $page */

?>
<!DOCTYPE html>
<html lang="<?= $kirby->language()->code() ?>">
<head>
  <meta charset="utf-8">
  <title><?= $page->title()->esc() ?> | <?= $site->title()->esc() ?></title>
  <meta name="description" content="<?= $page->excerpt()->esc() ?>">
</head>
<body>
  <main>
    <h1><?= $page->title()->esc() ?></h1>
    <?= $page->content()->get('content')->toBlocks() ?>
  </main>
</body>
</html>
