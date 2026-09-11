export function createLanguageRequestOptions(language) {
  return language ? { headers: { "x-language": language } } : {};
}
