import type { PluginContextResponse } from "../../../src/panel/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LICENSE_ACTIVATE_EVENT } from "../../../src/panel/constants";
import { createEventBus } from "../helpers/event-bus";

const api = { get: vi.fn() };
const events = createEventBus();

vi.mock("kirbyuse", () => ({
  usePanel: () => ({ api, events }),
  registerPluginAssets: vi.fn(),
}));

function contextResponse(
  licenseStatus: PluginContextResponse["licenseStatus"],
): PluginContextResponse {
  return {
    config: { analyzeOn: "publish" },
    assets: [],
    licenseStatus,
    licenseDialog: "johannschopplich-kirby-seo-audit/activate",
  };
}

beforeEach(() => {
  vi.resetModules();
  api.get.mockReset();
  events.clear();
});

describe("usePluginContext", () => {
  it("refetches the cached context after LICENSE_ACTIVATE_EVENT", async () => {
    const { usePluginContext } =
      await import("../../../src/panel/composables/plugin");
    api.get
      .mockResolvedValueOnce(contextResponse("inactive"))
      .mockResolvedValueOnce(contextResponse("active"));

    expect((await usePluginContext()).licenseStatus).toBe("inactive");
    expect((await usePluginContext()).licenseStatus).toBe("inactive");
    expect(api.get).toHaveBeenCalledTimes(1);

    events.emit(LICENSE_ACTIVATE_EVENT, undefined);

    expect((await usePluginContext()).licenseStatus).toBe("active");
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
