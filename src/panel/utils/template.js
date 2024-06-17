export function renderTemplate(input, variables, fallback) {
  return input.replace(
    /\{(\w+)\}/g,
    (_, key) =>
      variables[key.toLowerCase()] ||
      ((typeof fallback === "function" ? fallback(key) : fallback) ?? key),
  );
}
