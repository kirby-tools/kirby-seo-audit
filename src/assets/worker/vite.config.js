import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(currentDir, "../..");

export default defineConfig({
  plugins: [nodePolyfills()],

  build: {
    emptyOutDir: false,
    outDir: path.resolve(rootDir, "assets"),
    lib: {
      entry: path.resolve(currentDir, "index.js"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "worker.js",
        inlineDynamicImports: true,
      },
    },
  },
});
