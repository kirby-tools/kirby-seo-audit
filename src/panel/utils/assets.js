export async function interopDefault(m) {
  const resolved = await m;
  return resolved.default || resolved;
}
