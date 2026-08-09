import { describe, expect, it } from "vitest";
import { resolveDocumentLocale } from "./locale";

describe("resolveDocumentLocale", () => {
  it("should expand a bare language to its full locale", () => {
    expect(resolveDocumentLocale("de")).toBe("de-DE");
  });

  it("should keep a locale that already carries a region", () => {
    expect(resolveDocumentLocale("de-AT")).toBe("de-AT");
  });

  it("should resolve every Norwegian language code to Bokmål", () => {
    expect(resolveDocumentLocale("no")).toBe("nb-NO");
    expect(resolveDocumentLocale("nb")).toBe("nb-NO");
    expect(resolveDocumentLocale("nn")).toBe("nb-NO");
  });

  it("should resolve a regional Norwegian locale to Bokmål", () => {
    expect(resolveDocumentLocale("no-NO")).toBe("nb-NO");
  });

  it("should fall back to English for an unknown language", () => {
    expect(resolveDocumentLocale("xx")).toBe("en-US");
  });

  it("should fall back to English for a missing language", () => {
    expect(resolveDocumentLocale("")).toBe("en-US");
  });
});
