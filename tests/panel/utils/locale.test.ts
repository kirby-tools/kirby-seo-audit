import { describe, expect, it } from "vitest";
import { resolveDocumentLocale } from "../../../src/panel/utils/locale";

describe("resolveDocumentLocale", () => {
  it("expands de to de-DE", () => {
    expect(resolveDocumentLocale("de")).toBe("de-DE");
  });

  it("returns de-AT unchanged", () => {
    expect(resolveDocumentLocale("de-AT")).toBe("de-AT");
  });

  it("resolves `no`, nb, and nn to nb-NO", () => {
    expect(resolveDocumentLocale("no")).toBe("nb-NO");
    expect(resolveDocumentLocale("nb")).toBe("nb-NO");
    expect(resolveDocumentLocale("nn")).toBe("nb-NO");
  });

  it("resolves no-NO to nb-NO", () => {
    expect(resolveDocumentLocale("no-NO")).toBe("nb-NO");
  });

  it("falls back to en-US for an unknown xx", () => {
    expect(resolveDocumentLocale("xx")).toBe("en-US");
  });

  it("falls back to en-US for an empty language", () => {
    expect(resolveDocumentLocale("")).toBe("en-US");
  });
});
