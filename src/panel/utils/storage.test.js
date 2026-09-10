import { beforeEach, describe, expect, it } from "vitest";
import { readStoredReport, writeStoredReport } from "./storage";

describe("readStoredReport", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the report stored for en when de has one too", () => {
    writeStoredReport(
      { path: "pages/about", language: "en", section: "seoAudit" },
      { timestamp: 1 },
    );
    writeStoredReport(
      { path: "pages/about", language: "de", section: "seoAudit" },
      { timestamp: 2 },
    );

    expect(
      readStoredReport({
        path: "pages/about",
        language: "en",
        section: "seoAudit",
      }),
    ).toEqual({ timestamp: 1 });
  });

  it("returns undefined for en when only de has a stored report", () => {
    writeStoredReport(
      { path: "pages/about", language: "de", section: "seoAudit" },
      { timestamp: 1 },
    );

    expect(
      readStoredReport({
        path: "pages/about",
        language: "en",
        section: "seoAudit",
      }),
    ).toBeUndefined();
  });
});
