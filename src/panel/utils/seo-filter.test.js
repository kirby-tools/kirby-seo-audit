import { describe, expect, it } from "vitest";
import { IncompatibleLocaleError } from "./error";
import {
  filterYoastSeoResults,
  flattenYoastSeoResults,
  scoreToRating,
} from "./seo-filter";

describe("flattenYoastSeoResults", () => {
  it("tags each result with the category it arrived in", () => {
    const rawResult = {
      seo: { "": { results: [createResult("titleWidth")] } },
      readability: { results: [createResult("textParagraphTooLong")] },
    };

    expect(
      flattenYoastSeoResults(rawResult).map((i) => [
        i._identifier,
        i._category,
      ]),
    ).toEqual([
      ["titleWidth", "seo"],
      ["textParagraphTooLong", "readability"],
    ]);
  });
});

describe("filterYoastSeoResults", () => {
  it("drops a result without text", () => {
    const results = [createResult("titleWidth", { text: "" })];

    expect(filterYoastSeoResults(results, createOptions(), "en").seo).toEqual(
      [],
    );
  });

  it("drops singleH1 (the plugin assesses it itself)", () => {
    const results = [createResult("singleH1")];

    expect(filterYoastSeoResults(results, createOptions(), "en").seo).toEqual(
      [],
    );
  });

  it("drops keyphrase assessments for an empty keyword", () => {
    const results = [
      createResult("keyphraseDensity"),
      createResult("titleWidth"),
    ];

    const { seo } = filterYoastSeoResults(results, createOptions(), "en");

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
  });

  it("keeps keyphrase assessments once a keyword is set", () => {
    const results = [createResult("keyphraseDensity")];
    const options = createOptions({ keyword: "kirby" });

    const { seo } = filterYoastSeoResults(results, options, "en");

    expect(seo.map((i) => i._identifier)).toEqual(["keyphraseDensity"]);
  });

  it("keeps only the assessments named in options.assessments", () => {
    const results = [
      createResult("titleWidth"),
      createResult("metaDescriptionLength"),
    ];
    const options = createOptions({ assessments: ["titlewidth"] });

    const { seo } = filterYoastSeoResults(results, options, "en");

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
  });

  it("sorts each result into the category it carries", () => {
    const results = [
      createResult("titleWidth"),
      createResult("textParagraphTooLong", { category: "readability" }),
    ];

    const { seo, readability } = filterYoastSeoResults(
      results,
      createOptions(),
      "en",
    );

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
    expect(readability.map((i) => i._identifier)).toEqual([
      "textParagraphTooLong",
    ]);
  });

  it("adds the rating alongside the score", () => {
    const results = [createResult("titleWidth", { score: 3 })];

    const { seo } = filterYoastSeoResults(results, createOptions(), "en");

    expect(seo[0]).toMatchObject({ score: 3, rating: "bad" });
  });

  it("throws IncompatibleLocaleError for a selected assessment the locale cannot score", () => {
    const results = [createResult("wordComplexity")];
    const options = createOptions({ assessments: ["wordcomplexity"] });

    expect(() => filterYoastSeoResults(results, options, "nl")).toThrow(
      IncompatibleLocaleError,
    );
  });

  it("names the assessment and its locales on the error it throws", () => {
    const results = [createResult("wordComplexity")];
    const options = createOptions({ assessments: ["wordcomplexity"] });

    try {
      filterYoastSeoResults(results, options, "nl");
      expect.unreachable();
    } catch (error) {
      expect(error.locale).toBe("nl");
      expect(error.assessment).toBe("wordComplexity");
      expect(error.compatibleLocales).toContain("de");
    }
  });

  it("keeps a selected assessment its locale can score", () => {
    const results = [createResult("wordComplexity")];
    const options = createOptions({ assessments: ["wordcomplexity"] });

    const { seo } = filterYoastSeoResults(results, options, "de");

    expect(seo.map((i) => i._identifier)).toEqual(["wordComplexity"]);
  });

  it("leaves locale compatibility unchecked while no assessment is selected", () => {
    const results = [createResult("wordComplexity")];

    const { seo } = filterYoastSeoResults(results, createOptions(), "nl");

    expect(seo.map((i) => i._identifier)).toEqual(["wordComplexity"]);
  });
});

describe("scoreToRating", () => {
  it.each([
    [-1, "error"],
    [0, "feedback"],
    [3, "bad"],
    [4, "bad"],
    [5, "ok"],
    [7, "ok"],
    [8, "good"],
    [9, "good"],
  ])("maps %i to %s", (score, rating) => {
    expect(scoreToRating(score)).toBe(rating);
  });

  it("maps a missing score to the empty rating", () => {
    expect(scoreToRating(undefined)).toBe("");
  });
});

function createResult(
  identifier,
  { text = "Some feedback.", score = 9, category = "seo" } = {},
) {
  return { _identifier: identifier, text, score, _category: category };
}

function createOptions({ keyword = "", assessments = [] } = {}) {
  return { keyword, assessments };
}
