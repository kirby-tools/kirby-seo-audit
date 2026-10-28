import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import ReportBody from "../../../src/panel/components/Ui/ReportBody.vue";
import { labels } from "../helpers/audit-labels";
import { panelStubs } from "../helpers/panel-stubs";

it("heads the report with the only category that has results", () => {
  const wrapper = mount(ReportBody, {
    props: {
      results: {
        seo: [{ score: 3, rating: "bad", text: "No keyphrase in the title" }],
        readability: [],
      },
      labels,
    },
    global: { stubs: panelStubs },
  });

  expect(wrapper.find("h2").text()).toBe("results.seo");
});
