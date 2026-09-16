import { describe, expect, it } from "vitest";
import { resolveAnalyzeOn } from "../../../src/panel/utils/analyze-on";

describe("resolveAnalyzeOn", () => {
  it("lets the blueprint value win over the global option", () => {
    expect(resolveAnalyzeOn("publish", undefined)).toBe("publish");
    expect(resolveAnalyzeOn(undefined, "publish")).toBe("publish");
    expect(resolveAnalyzeOn(false, "publish")).toBeUndefined();
  });

  it("switches off for anything but a known trigger", () => {
    expect(resolveAnalyzeOn(true, undefined)).toBeUndefined();
    expect(resolveAnalyzeOn("save", "publish")).toBeUndefined();
    expect(resolveAnalyzeOn(undefined, undefined)).toBeUndefined();
  });
});
