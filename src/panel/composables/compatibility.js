export function useCompatibility() {
  if (!window.panel.$api) {
    throw new Error("Kirby SEO Audit requires Kirby 4");
  }
}
