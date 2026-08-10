import { describe, expect, it } from "vitest";
import { IncompatibleLocaleError } from "./error";
import { filterYoastSeoResults, scoreToRating } from "./seo-filter";

describe("filterYoastSeoResults", () => {
  it("drops a result without text", () => {
    const rawResult = createRawResult({
      seo: [createResult("titleWidth", { text: "" })],
    });

    expect(filterYoastSeoResults(rawResult, createOptions(), "en").seo).toEqual(
      [],
    );
  });

  it("drops singleH1, which the plugin assesses itself", () => {
    const rawResult = createRawResult({ seo: [createResult("singleH1")] });

    expect(filterYoastSeoResults(rawResult, createOptions(), "en").seo).toEqual(
      [],
    );
  });

  it("drops keyphrase assessments for an empty keyword", () => {
    const rawResult = createRawResult({
      seo: [createResult("keyphraseDensity"), createResult("titleWidth")],
    });

    const { seo } = filterYoastSeoResults(rawResult, createOptions(), "en");

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
  });

  it("keeps keyphrase assessments once a keyword is set", () => {
    const rawResult = createRawResult({
      seo: [createResult("keyphraseDensity")],
    });
    const options = createOptions({ keyword: "kirby" });

    const { seo } = filterYoastSeoResults(rawResult, options, "en");

    expect(seo.map((i) => i._identifier)).toEqual(["keyphraseDensity"]);
  });

  it("keeps only the assessments named in options.assessments", () => {
    const rawResult = createRawResult({
      seo: [createResult("titleWidth"), createResult("metaDescriptionLength")],
    });
    const options = createOptions({ assessments: ["titlewidth"] });

    const { seo } = filterYoastSeoResults(rawResult, options, "en");

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
  });

  it("sorts each result into the category it arrived in", () => {
    const rawResult = createRawResult({
      seo: [createResult("titleWidth")],
      readability: [createResult("textParagraphTooLong")],
    });

    const { seo, readability } = filterYoastSeoResults(
      rawResult,
      createOptions(),
      "en",
    );

    expect(seo.map((i) => i._identifier)).toEqual(["titleWidth"]);
    expect(readability.map((i) => i._identifier)).toEqual([
      "textParagraphTooLong",
    ]);
  });

  it("adds the rating alongside the score", () => {
    const rawResult = createRawResult({
      seo: [createResult("titleWidth", { score: 3 })],
    });

    const { seo } = filterYoastSeoResults(rawResult, createOptions(), "en");

    expect(seo[0]).toMatchObject({ score: 3, rating: "bad" });
  });

  it("throws IncompatibleLocaleError for a selected assessment the locale cannot score", () => {
    const rawResult = createRawResult({
      seo: [createResult("wordComplexity")],
    });
    const options = createOptions({ assessments: ["wordcomplexity"] });

    expect(() => filterYoastSeoResults(rawResult, options, "nl")).toThrow(
      IncompatibleLocaleError,
    );
  });

  it("names the assessment and its locales on the error it throws", () => {
    const rawResult = createRawResult({
      seo: [createResult("wordComplexity")],
    });
    const options = createOptions({ assessments: ["wordcomplexity"] });

    try {
      filterYoastSeoResults(rawResult, options, "nl");
      expect.unreachable();
    } catch (error) {
      expect(error.locale).toBe("nl");
      expect(error.assessment).toBe("wordComplexity");
      expect(error.compatibleLocales).toContain("de");
    }
  });

  it("keeps a selected assessment its locale can score", () => {
    const rawResult = createRawResult({
      seo: [createResult("wordComplexity")],
    });
    const options = createOptions({ assessments: ["wordcomplexity"] });

    const { seo } = filterYoastSeoResults(rawResult, options, "de");

    expect(seo.map((i) => i._identifier)).toEqual(["wordComplexity"]);
  });

  it("leaves locale compatibility unchecked while no assessment is selected", () => {
    const rawResult = createRawResult({
      seo: [createResult("wordComplexity")],
    });

    const { seo } = filterYoastSeoResults(rawResult, createOptions(), "nl");

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
});

// The shape the analysis worker hands back: SEO results sit under an empty
// keyphrase key, readability results one level higher.
function createRawResult({ seo = [], readability = [] } = {}) {
  return {
    seo: { "": { results: seo } },
    readability: { results: readability },
  };
}

function createResult(identifier, { text = "Some feedback.", score = 9 } = {}) {
  return { _identifier: identifier, text, score };
}

function createOptions({ keyword = "", assessments = [] } = {}) {
  return { keyword, assessments };
}
