/**
 * Creates the request options that resolve an API request in `language`. A
 * single-language site and the playground have no language, and the request
 * then runs in Kirby's default language.
 */
export function createLanguageRequestOptions(language) {
  return language ? { headers: { "x-language": language } } : {};
}
