import { resolve } from "node:path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { rootDir } from "../constants";

export default defineConfig({
  plugins: [nodePolyfills()],

  build: {
    emptyOutDir: false,
    outDir: resolve(rootDir, "assets"),
    lib: {
      entry: resolve(rootDir, "node_modules/yoastseo/index.js"),
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
