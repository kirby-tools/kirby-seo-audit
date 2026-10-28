# One PHP-Owned Activation Dialog

Up to 0.9, a license was activated through two dialogs: the `{slug}/activate` dialog this package registers for the System view, and a second one built in `@kirby-tools/licensing` that posted to a bare `__{plugin}__/activate` API route, matched English exception sentences to i18n keys, and reloaded the whole page on success. From 1.0, the PHP dialog is the only one: every Panel button opens it by its id (`<k-button :dialog>`), its submit returns Panel actions (`message`, an `event` per plugin, `reload`) instead of a redirect, and failures carry an `ActivationOutcome` instead of a sentence. One dialog keeps the fields, strings and error mapping in one place and lets Kirby's view reload refresh every `licenseStatus` prop, so the npm package ships no strings and no request code of its own.

## Considered Options

- **Keep the TS dialog on Vue 3** – rejected: it duplicates the fields and strings, needs the API route and its response envelope, and only a full page reload refreshes the plugins' snapshotted status.
- **Both dialogs, sharing a coded error** – rejected: two submit paths to keep in sync for no gain, since `k-button` opens a backend dialog by id anywhere in the Panel.

## Consequences

A component that hosts the license buttons and outlives the view reload – a Panel dialog the history reopens, a view button whose setup does not re-run – listens for `kirby-tools.license.activate.{pluginId}` and updates its own status.
