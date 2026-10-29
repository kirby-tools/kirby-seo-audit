// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("site barrel", () => {
  it("loads without `window`", async () => {
    expect(globalThis.window).toBeUndefined();

    const { AuditButton, AuditField, ReportBody } =
      await import("../../src/panel/site");

    expect(AuditButton).toBeTypeOf("object");
    expect(AuditField).toBeTypeOf("object");
    expect(ReportBody).toBeTypeOf("object");
  });
});
