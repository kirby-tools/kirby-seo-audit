import { describe, expect, it } from "vitest";
import { resolveAuto } from "../../../src/panel/utils/auto";

describe("resolveAuto", () => {
  it("lets the blueprint value win over the global option", () => {
    expect(resolveAuto("publish", undefined)).toBe("publish");
    expect(resolveAuto(undefined, "publish")).toBe("publish");
    expect(resolveAuto(false, "publish")).toBeUndefined();
  });

  it("switches off for anything but a known trigger", () => {
    expect(resolveAuto(true, undefined)).toBeUndefined();
    expect(resolveAuto("save", "publish")).toBeUndefined();
    expect(resolveAuto(undefined, undefined)).toBeUndefined();
  });
});
