export class IncompatibleLocaleError extends Error {
  constructor({ locale, assessment, compatibleLocales }) {
    super(
      `Locale ${locale.toUpperCase()} is not supported by the assessment ${assessment}.`,
    );

    this.locale = locale;
    this.assessment = assessment;
    this.compatibleLocales = compatibleLocales;
  }
}

export class MissingPreviewUrlError extends Error {
  constructor({ path }) {
    super(`Model has no preview URL: ${path}`);
  }
}

export class PreviewResponseError extends Error {
  constructor({ url, status, isProxied = false }) {
    super(`Preview URL ${url} responded with status ${status}`);

    this.url = url;
    this.status = status;
    this.isProxied = isProxied;
  }
}
