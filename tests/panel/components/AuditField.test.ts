import type { Report } from "../../../src/panel/types";
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import AuditField from "../../../src/panel/components/Ui/AuditField.vue";
import { labels } from "../helpers/audit-labels";
import { panelStubs } from "../helpers/panel-stubs";

const report: Report = {
  results: {
    seo: [{ score: 3, rating: "bad", text: "No keyphrase in the title" }],
    readability: [],
  },
  ratings: {
    seo: { score: 30, rating: "bad" },
    readability: undefined,
  },
  version: "changes",
  timestamp: Date.UTC(2026, 9, 28, 12),
};

it("renders the report with the rendered labels and the options slot", () => {
  const wrapper = mount(AuditField, {
    props: { label: "SEO", labels, ...report, isStale: true },
    slots: { options: "<span>license</span>" },
    global: { stubs: panelStubs },
  });

  expect(wrapper.find("header").text()).toBe("SEOlicense");
  expect(wrapper.text()).toContain("category.seo");
  expect(wrapper.text()).toContain("rating.bad");
  expect(wrapper.text()).toContain("No keyphrase in the title");
  expect(wrapper.text()).toMatch(/version\.changes · .+ · rating\.stale/);
});

it("emits analyze and disables the button while analyzing", async () => {
  const wrapper = mount(AuditField, {
    props: { label: "SEO", labels, isAnalyzing: true },
    global: { stubs: panelStubs },
  });

  expect(wrapper.find("button").attributes("disabled")).toBeDefined();

  await wrapper.setProps({ isAnalyzing: false });
  await wrapper.find("button").trigger("click");

  expect(wrapper.emitted("analyze")).toHaveLength(1);
});
