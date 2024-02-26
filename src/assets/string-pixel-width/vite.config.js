import { resolve } from "node:path";
import { defineConfig } from "vite";
import { rootDir } from "../constants";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: resolve(rootDir, "assets"),
    lib: {
      entry: resolve(rootDir, "node_modules/string-pixel-width/lib/index.js"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "string-pixel-width.js",
        inlineDynamicImports: true,
        generatedCode: { constBindings: true },
        externalLiveBindings: false,
      },
    },
  },
});
