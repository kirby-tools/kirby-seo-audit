import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { rootDir } from "../constants";

export const currentDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [nodePolyfills()],

  resolve: {
    alias: {
      yoastseo: resolve(currentDir, "index.js"),
    },
  },

  build: {
    outDir: resolve(rootDir, "assets"),
    lib: {
      entry: resolve(currentDir, "index.js"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "yoastseo.js",
        inlineDynamicImports: true,
        generatedCode: { constBindings: true },
        externalLiveBindings: false,
      },
    },
  },
});
