export class IncompatibleLocaleError extends Error {
  locale: string;
  assessment: string;
  compatibleLocales: string[];

  constructor({
    locale,
    assessment,
    compatibleLocales,
  }: {
    locale: string;
    assessment: string;
    compatibleLocales: string[];
  }) {
    super(
      `Locale ${locale.toUpperCase()} is not supported by the assessment ${assessment}.`,
    );

    this.locale = locale;
    this.assessment = assessment;
    this.compatibleLocales = compatibleLocales;
  }
}

export class MissingPreviewUrlError extends Error {
  constructor({ path }: { path: string }) {
    super(`Model has no preview URL: ${path}`);
  }
}

export class PreviewResponseError extends Error {
  url: string;
  status: number;
  isProxied: boolean;

  constructor({
    url,
    status,
    isProxied = false,
  }: {
    url: string;
    status: number;
    isProxied?: boolean;
  }) {
    super(`Preview URL ${url} responded with status ${status}`);

    this.url = url;
    this.status = status;
    this.isProxied = isProxied;
  }
}

export class PreviewUnreachableError extends Error {
  url: string;

  constructor({ url }: { url: string }) {
    super(`Preview URL ${url} could not be reached`);

    this.url = url;
  }
}
