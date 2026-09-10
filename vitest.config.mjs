import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/panel/**/*.{test,spec}.?(m)js"],
    environment: "happy-dom",
    // Node's own `localStorage` global shadows happy-dom's from Node 25 on.
    execArgv: ["--no-experimental-webstorage"],
  },
});
