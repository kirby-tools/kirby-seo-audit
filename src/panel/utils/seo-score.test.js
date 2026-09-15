import { describe, expect, it } from "vitest";
import {
  aggregateReadabilityScore,
  aggregateSeoScore,
  rateReport,
  toRatingRecord,
  worstRating,
} from "./seo-score";

describe("aggregateSeoScore", () => {
  it("scales the mean score of the results to 100", () => {
    expect(aggregateSeoScore([{ score: 9 }, { score: 9 }])).toBe(100);
    expect(aggregateSeoScore([{ score: 9 }, { score: 3 }])).toBe(67);
    expect(aggregateSeoScore([{ score: 3 }])).toBe(33);
  });

  it("counts feedback but leaves errored results out", () => {
    expect(aggregateSeoScore([{ score: 9 }, { score: 0 }])).toBe(50);
    expect(aggregateSeoScore([{ score: 9 }, { score: -1 }])).toBe(100);
  });

  it("returns 0 without a scored result", () => {
    expect(aggregateSeoScore([])).toBe(0);
    expect(aggregateSeoScore([{ score: -1 }])).toBe(0);
  });
});

describe("aggregateReadabilityScore", () => {
  it("returns 0 for a single result", () => {
    expect(aggregateReadabilityScore([{ score: 9 }], "en")).toBe(0);
  });

  it("rates by the summed penalty of the ratings", () => {
    const good = { score: 9 };
    const ok = { score: 6 };
    const bad = { score: 3 };

    expect(aggregateReadabilityScore([good, good], "en")).toBe(90);
    expect(aggregateReadabilityScore([ok, bad], "en")).toBe(60);
    expect(aggregateReadabilityScore([bad, bad, ok], "en")).toBe(30);
  });

  it("penalizes a partially supported language harder", () => {
    const bad = { score: 3 };
    const good = { score: 9 };

    expect(aggregateReadabilityScore([bad, good], "en")).toBe(90);
    expect(aggregateReadabilityScore([bad, good], "ja")).toBe(60);
  });
});

describe("rateReport", () => {
  it("rates both categories with Yoast's thresholds", () => {
    expect(
      rateReport(
        {
          seo: [{ score: 9 }, { score: 3 }],
          readability: [{ score: 9 }, { score: 9 }],
        },
        "en",
      ),
    ).toEqual({
      seo: { score: 67, rating: "ok" },
      readability: { score: 90, rating: "good" },
    });
  });

  it("leaves a category without results unrated and one without a score at none", () => {
    expect(rateReport({ seo: [], readability: [{ score: 9 }] }, "en")).toEqual({
      seo: undefined,
      readability: { score: 0, rating: "none" },
    });
  });
});

describe("worstRating", () => {
  it("picks the light to act on first", () => {
    expect(worstRating({ seo: "good", readability: "bad" })).toBe("bad");
    expect(worstRating({ seo: "ok", readability: "good" })).toBe("ok");
  });

  it("ignores none and missing categories", () => {
    expect(worstRating({ seo: "none", readability: "good" })).toBe("good");
    expect(worstRating({ seo: null, readability: null })).toBe("none");
  });
});

describe("toRatingRecord", () => {
  it("keeps one light per category and counts the results", () => {
    const report = {
      results: {
        seo: [{ rating: "good" }, { rating: "bad" }, { rating: "feedback" }],
        readability: [{ rating: "ok" }, { rating: "error" }],
      },
      ratings: {
        seo: { score: 50, rating: "ok" },
        readability: undefined,
      },
    };

    expect(toRatingRecord(report, "changes")).toEqual({
      seo: "ok",
      readability: null,
      counts: { good: 1, ok: 1, bad: 1 },
      version: "changes",
    });
  });
});
