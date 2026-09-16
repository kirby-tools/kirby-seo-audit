import { describe, expect, it } from "vitest";
import {
  altAttribute,
  headingStructureOrder,
  singleH1,
} from "../../../../src/panel/utils/assessments";

describe("singleH1", () => {
  it("passes with exactly one H1", () => {
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

  it("fails with two H1s", () => {
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

  it("fails without an H1", () => {
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

  it("counts a content element that is itself an H1", () => {
    const htmlDocument = createHtmlDocument("<h1>Title</h1><p>Text</p>");
    const result = singleH1({
      htmlDocument,
      contentSelector: "body > *",
    });
    expect(result.translation).toBe("one");
  });
});

describe("altAttribute", () => {
  it("passes without images", () => {
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

  it("passes with an alt attribute on every image", () => {
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

  it("passes with an empty alt attribute", () => {
    const htmlDocument = createHtmlDocument(
      '<div><img src="decoration.svg" alt=""></div>',
    );
    const result = altAttribute({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result.translation).toBe("every");
  });

  it("fails with one of two images lacking an alt attribute", () => {
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
  it("passes with an H2 following an H1", () => {
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

  it("fails with an H3 directly following an H1", () => {
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

  it("fails with an H2 as the first heading", () => {
    const htmlDocument = createHtmlDocument("<div><h2>Section</h2></div>");
    const result = headingStructureOrder({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result.translation).toBe("nonSequential");
  });

  it("escapes the heading text in the details", () => {
    const htmlDocument = createHtmlDocument(
      "<div><h1>Title</h1><h3>Tags &amp; &lt;b&gt;</h3></div>",
    );
    const result = headingStructureOrder({
      htmlDocument,
      contentSelector: "div",
    });
    expect(result.details?.text).toBe(
      "<ul><li><strong>H3</strong>: Tags &amp; &lt;b&gt;</li></ul>",
    );
  });
});

function createHtmlDocument(content: string) {
  const parser = new DOMParser();
  return parser.parseFromString(content, "text/html");
}
