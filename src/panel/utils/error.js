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
