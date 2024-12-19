export function renderTemplate(input, variables, fallback) {
  return input.replace(
    /\{\s*(\w+)\s*\}/g,
    (_, key) =>
      variables[key.toLowerCase()] ||
      ((typeof fallback === "function" ? fallback(key) : fallback) ?? key),
  );
}
