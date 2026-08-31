# Kirby 6 Migration Checklist

Everything in this plugin that only works because the Panel still runs Vue 2 or
still ships a Kirby 5 alias. Each entry names the site, what breaks, and what to
put there instead. Nothing here can be fixed ahead of the Vue 3 switch – the
spellings that survive both versions have already been changed in place.

Read top to bottom while migrating, then delete the file.

## Vue 3

- **`slot="options"`** – `Sections/SeoAudit.vue:226`. Vue 2 slot syntax; Vue 3
  ignores it, so the section header loses its licensing buttons. Replace with
  `<template #options v-if="…">`.

## Renamed Panel Components

- **`k-box` `html` flag** – `Ui/AuditResultItem.vue:40`. Deprecated in Kirby 6.
  Dropping it renders the assessment markup as literal text in both versions,
  because Kirby 6's `v-safe-html` escapes anything that is not an `HtmlString`
  and Kirby 5's interpolation escapes too. Wrap the value in Kirby 6's trust
  helper at the same time and confirm the assessment links survive.

## Version Branches

- **`isKirby5()`** – `Sections/SeoAudit.vue:36,252`. Kirby 6 is the Vue 3 break,
  so every branch goes with the migration.

## Visual

- **Separator darkening** – `Ui/AuditResult.vue` darkens the `hr` outside the
  dialog, because Kirby 5's `passive` box sits on grey and swallows the default.
  Kirby 6 renders that box plain, the way the dialog already does, so the
  `isDialog` branch on the `hr`'s `background` can go.
