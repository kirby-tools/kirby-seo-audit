import { describe, expect, it } from "vitest";
import { altAttribute, headingStructureOrder, singleH1 } from ".";

describe("singleH1", () => {
  it("should pass if there is exactly one H1 tag", () => {
    const htmlDocument = createHtmlDocument("<div><h1>Title</h1></div>");
    const result = singleH1({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 9,
        "translation": "one",
      }
    `);
  });

  it("should fail if there are multiple H1 tags", () => {
    const htmlDocument = createHtmlDocument(
      "<div><h1>Title</h1><h1>Another Title</h1></div>",
    );
    const result = singleH1({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 3,
        "translation": "multiple",
      }
    `);
  });

  it("should fail if there are no H1 tags", () => {
    const htmlDocument = createHtmlDocument("<div></div>");
    const result = singleH1({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 3,
        "translation": "none",
      }
    `);
  });
});

describe("altAttribute", () => {
  it("should pass if there are no images", () => {
    const htmlDocument = createHtmlDocument("<div></div>");
    const result = altAttribute({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 9,
        "translation": "na",
      }
    `);
  });

  it("should pass if all images have an alt attribute", () => {
    const htmlDocument = createHtmlDocument(
      '<div><img src="image.jpg" alt="Image description"></div>',
    );
    const result = altAttribute({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 9,
        "translation": "every",
      }
    `);
  });

  it("should fail if any image lacks an alt attribute", () => {
    const htmlDocument = createHtmlDocument(
      '<div><img src="image.jpg"><img src="another.jpg" alt="Description"></div>',
    );
    const result = altAttribute({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "context": {
          "imagesWithoutAltAttribute": 1,
        },
        "score": 3,
        "translation": "some",
      }
    `);
  });
});

describe("headingStructureOrder", () => {
  it("should pass if headings follow a proper sequential order", () => {
    const htmlDocument = createHtmlDocument(
      "<div><h1>Title</h1><h2>Subtitle</h2></div>",
    );
    const result = headingStructureOrder({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "score": 9,
        "translation": "sequential",
      }
    `);
  });

  it("should fail if headings do not follow a proper sequential order", () => {
    const htmlDocument = createHtmlDocument(
      "<div><h1>Title</h1><h3>Subsection without H2</h3></div>",
    );
    const result = headingStructureOrder({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "details": {
          "text": "<ul><li><strong>H3</strong>: Subsection without H2</li></ul>",
        },
        "score": 3,
        "translation": "nonSequential",
      }
    `);
  });
});

function createHtmlDocument(content) {
  const parser = new DOMParser();
  return parser.parseFromString(content, "text/html");
}
