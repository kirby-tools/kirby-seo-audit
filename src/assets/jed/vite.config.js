import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { rootDir } from "../constants";

export const currentDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: resolve(rootDir, "assets"),
    lib: {
      entry: resolve(currentDir, "index.js"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "jed.js",
        inlineDynamicImports: true,
      },
    },
  },
});
