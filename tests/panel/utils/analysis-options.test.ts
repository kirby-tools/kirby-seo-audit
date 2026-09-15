import { describe, expect, it } from "vitest";
import {
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} from "../../../src/panel/utils/analysis-options";

describe("resolveKeyphrase", () => {
  it("returns the keyphrase value over the field", () => {
    expect(
      resolveKeyphrase({ seokeyphrase: "cms" }, "kirby cms", "seoKeyphrase"),
    ).toBe("kirby cms");
  });

  it("reads the field from the content by its lowercased name", () => {
    expect(resolveKeyphrase({ seokeyphrase: "cms" }, "", "seoKeyphrase")).toBe(
      "cms",
    );
  });

  it("returns an empty string without a value or a field", () => {
    expect(resolveKeyphrase({})).toBe("");
    expect(resolveKeyphrase({}, "", "seoKeyphrase")).toBe("");
  });
});

describe("resolveSynonyms", () => {
  it("returns a list as it is", () => {
    expect(resolveSynonyms({}, ["cms", "kirby"])).toEqual(["cms", "kirby"]);
  });

  it("splits a comma-separated string and trims each synonym", () => {
    expect(resolveSynonyms({}, "cms, kirby ,flat file")).toEqual([
      "cms",
      "kirby",
      "flat file",
    ]);
  });

  it("reads the field from the content by its lowercased name", () => {
    expect(
      resolveSynonyms({ seosynonyms: "cms,kirby" }, undefined, "seoSynonyms"),
    ).toEqual(["cms", "kirby"]);
  });

  it("returns an empty list without a value or a field", () => {
    expect(resolveSynonyms({})).toEqual([]);
    expect(resolveSynonyms({}, "", "seoSynonyms")).toEqual([]);
  });
});

describe("resolveLogLevelIndex", () => {
  it("indexes a known level", () => {
    expect(resolveLogLevelIndex("debug", "error")).toBe(3);
  });

  it("indexes the fallback without a known value", () => {
    expect(resolveLogLevelIndex(undefined, "info")).toBe(2);
    expect(resolveLogLevelIndex("verbose" as never, "info")).toBe(2);
  });

  it("indexes the default level without a value or a fallback", () => {
    expect(resolveLogLevelIndex()).toBe(1);
    expect(resolveLogLevelIndex(null, null)).toBe(1);
  });
});
