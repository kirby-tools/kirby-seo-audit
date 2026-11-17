// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { extractContent } from "../../../src/panel/utils/seo-review";

describe("extractContent", () => {
  it("keeps the tags of the elements the selector matches", () => {
    const htmlDocument = new DOMParser().parseFromString(
      `<main><h2>Title</h2><img src="a.jpg" alt=""></main>`,
      "text/html",
    );

    expect(extractContent(htmlDocument, "main > *")).toBe(
      `<h2>Title</h2>\n<img src="a.jpg" alt="">`,
    );
  });
});
