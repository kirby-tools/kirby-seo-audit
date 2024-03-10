/**
 * @typedef {object} PluginAsset
 * @property {string} filename - The name of the asset.
 * @property {string} url - The URL of the asset.
 */

/** @type {PluginAsset[]} */
let _assets = [];

const moduleCache = new Map();

export async function registerPluginAssets(assets) {
  if (!Array.isArray(assets)) {
    throw new TypeError("Expected an array of assets");
  }

  if (_assets.length > 0) return;

  _assets = assets;
}

export function resolvePluginAsset(filename) {
  if (_assets.length === 0) {
    throw new Error("Plugin assets are not registered");
  }

  const asset = _assets.find((asset) => asset.filename === filename);

  if (!asset) {
    throw new Error(`Plugin asset "${filename}" not found`);
  }

  return asset;
}

export async function getModule(filename) {
  if (!filename.endsWith(".js")) {
    filename += ".js";
  }

  if (moduleCache.has(filename)) {
    return moduleCache.get(filename);
  }

  const asset = resolvePluginAsset(filename);
  const mod = await import(/* @vite-ignore */ asset.url);
  moduleCache.set(filename, mod);
  return mod;
}

export async function interopDefault(m) {
  const resolved = await m;
  return resolved.default || resolved;
}
