import type { Rating } from "../../../src/panel/types";
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import AuditButton from "../../../src/panel/components/Ui/AuditButton.vue";
import { panelStubs } from "../helpers/panel-stubs";

const rating: Rating = {
  seo: "good",
  readability: "ok",
  counts: { good: 3, ok: 1, bad: 0 },
  version: "latest",
  timestamp: 1_700_000_000,
  isStale: true,
};

it("badges the worst rating and marks a stale one", () => {
  const wrapper = mount(AuditButton, {
    props: { label: "SEO", rating },
    global: { stubs: panelStubs },
  });

  expect(JSON.parse(wrapper.find("button").attributes("data-badge")!)).toEqual({
    theme: "notice",
    text: "!",
  });
});

it("leaves the badge of a fresh rating unmarked", () => {
  const wrapper = mount(AuditButton, {
    props: { label: "SEO", rating: { ...rating, isStale: false } },
    global: { stubs: panelStubs },
  });

  expect(JSON.parse(wrapper.find("button").attributes("data-badge")!)).toEqual({
    theme: "notice",
  });
});

it("shows no badge before the first analysis", () => {
  const wrapper = mount(AuditButton, {
    props: { label: "SEO", rating: { ...rating, timestamp: null } },
    global: { stubs: panelStubs },
  });

  expect(wrapper.find("button").attributes("data-badge")).toBeUndefined();
});
