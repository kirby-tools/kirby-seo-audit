// @vitest-environment happy-dom
import type { AnalysisOptions } from "../../../src/panel/types";
import { shallowMount } from "@vue/test-utils";
import { beforeEach, expect, it, vi } from "vitest";
import { ref } from "vue";
import ViewButton from "../../../src/panel/components/ViewButton.vue";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../../../src/panel/constants";

const api = { get: vi.fn() };
let resolveOptions: (language: string | null) => Promise<AnalysisOptions>;

vi.mock("kirbyuse", () => ({
  useContent: () => ({ currentContent: ref({}) }),
  usePanel: () => ({
    api,
    view: { path: "pages/about" },
    t: (key: string) => key,
  }),
}));

vi.mock("../../../src/panel/composables", () => ({
  useAnalysis: (options: { resolveOptions: typeof resolveOptions }) => {
    resolveOptions = options.resolveOptions;
    return { analyze: vi.fn(), isAnalyzing: ref(false), rating: ref() };
  },
  usePluginContext: async () => ({ config: {} }),
}));

beforeEach(() => {
  api.get.mockReset().mockResolvedValue({
    keyphrase: "Analyzing Kirby",
    synonyms: null,
  });
});

it("resolves the keyphrase { page.title } through the button-options route", async () => {
  shallowMount(ViewButton, {
    props: { keyphrase: "{ page.title }" },
  });

  const { keyword } = await resolveOptions(null);

  expect(api.get).toHaveBeenCalledWith(
    PLUGIN_BUTTON_OPTIONS_API_ROUTE,
    { path: "pages/about" },
    expect.anything(),
    true,
  );
  expect(keyword).toBe("Analyzing Kirby");
});

it("skips the button-options route without a keyphrase or synonyms", async () => {
  shallowMount(ViewButton);

  await resolveOptions(null);

  expect(api.get).not.toHaveBeenCalled();
});

it("keeps its own keyphrase when the button-options route returns null", async () => {
  api.get.mockResolvedValue({ keyphrase: null, synonyms: null });
  shallowMount(ViewButton, {
    props: { keyphrase: "Kirby CMS" },
  });

  const { keyword } = await resolveOptions(null);

  expect(keyword).toBe("Kirby CMS");
});
