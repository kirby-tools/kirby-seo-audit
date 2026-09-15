import { vi } from "vitest";
import { computed, ref, watch } from "vue";

// kirbyuse reads `window.Vue` when imported, so every composable test
// replaces it with Vue's own reactivity and a silent logger.
export function baseKirbyuseMock() {
  return {
    ref,
    computed,
    watch,
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
}
