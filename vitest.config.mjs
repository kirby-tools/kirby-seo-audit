import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/panel/**/*.{test,spec}.?(m)js"],
    environment: "happy-dom",
  },
});
