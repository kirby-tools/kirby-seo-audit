export function renderTemplate(input, variables, fallback) {
  return input.replace(
    // eslint-disable-next-line e18e/prefer-static-regex
    /\{(\w+)\}/g,
    (_, key) =>
      variables[key.toLowerCase()] ||
      ((typeof fallback === "function" ? fallback(key) : fallback) ?? key),
  );
}
