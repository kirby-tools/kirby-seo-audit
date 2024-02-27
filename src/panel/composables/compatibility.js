export function useCompatibility() {
  if (!window.panel.$api) {
    throw new Error("Kirby SEO Insights requires Kirby 4");
  }
}
