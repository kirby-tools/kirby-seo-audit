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
    <?= $page->content()->toBlocks() ?>
  </main>
</body>
</html>
