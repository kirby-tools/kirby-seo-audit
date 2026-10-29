import { shallowMount } from "@vue/test-utils";
import { expect, it, vi } from "vitest";
import { ref } from "vue";
import SeoAudit from "../../../src/panel/components/Fields/SeoAudit.vue";

vi.mock("kirbyuse", () => ({
  useContent: () => ({ currentContent: ref({}) }),
  usePanel: () => ({
    view: { path: "pages/about" },
    language: { code: "en" },
  }),
}));

vi.mock("@kirby-tools/licensing/components", () => ({
  LicensingButtonGroup: {},
}));

vi.mock("../../../src/panel/composables", () => ({
  useAnalysis: () => ({
    analyze: vi.fn(),
    isAnalyzing: ref(false),
    rating: ref(),
    report: ref(),
  }),
  useAuditLabels: () => ({}),
  usePluginContext: async () => ({ config: {} }),
}));

it("keeps disabled off k-field", () => {
  const wrapper = shallowMount(SeoAudit, {
    props: {
      name: "seo",
      label: "SEO Audit",
      licenseStatus: "active",
      licenseDialog: "",
    },
    attrs: { disabled: true },
  });

  expect(wrapper.attributes("disabled")).toBeUndefined();
});
