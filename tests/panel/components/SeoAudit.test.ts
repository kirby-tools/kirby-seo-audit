import { mount } from "@vue/test-utils";
import { expect, it, vi } from "vitest";
import { ref } from "vue";
import SeoAudit from "../../../src/panel/components/Fields/SeoAudit.vue";
import { labels } from "../helpers/audit-labels";
import { panelStubs } from "../helpers/panel-stubs";

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
  useAuditLabels: () => labels,
  usePluginContext: async () => ({ config: {} }),
}));

it("keeps disabled off k-field", () => {
  const wrapper = mount(SeoAudit, {
    props: {
      name: "seo",
      label: "SEO Audit",
      licenseStatus: "active",
      licenseDialog: "",
    },
    attrs: { disabled: true },
    global: { stubs: panelStubs },
  });

  expect(wrapper.find("section").attributes("disabled")).toBeUndefined();
});
