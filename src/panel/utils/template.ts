export function renderTemplate(
  input: string,
  variables: Record<string, unknown>,
  fallback?: string | ((key: string) => string),
) {
  return input.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(
      variables[key.toLowerCase()] ||
        ((typeof fallback === "function" ? fallback(key) : fallback) ?? key),
    ),
  );
}
