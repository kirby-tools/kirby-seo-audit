import type { Report } from "../../../src/panel/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "../helpers/flush-promises";

const api = { get: vi.fn() };
const events = createEventBus();
const panel = { view: { path: "pages/about" }, api, events };
const beforeUnmountHooks: Array<() => void> = [];

vi.mock("kirbyuse", async () => {
  const { baseKirbyuseMock } = await import("../helpers/mock-kirbyuse");
  return {
    ...baseKirbyuseMock(),
    usePanel: () => panel,
    onBeforeUnmount: (hook: () => void) => beforeUnmountHooks.push(hook),
    registerPluginAssets: vi.fn(),
  };
});

const report: Report = {
  results: { seo: [], readability: [] },
  ratings: { seo: undefined, readability: undefined },
  timestamp: 1_700_000_000,
};

beforeEach(() => {
  vi.resetModules();
  api.get.mockReset();
  events.clear();
  beforeUnmountHooks.length = 0;
  window.panel = panel as unknown as Window["panel"];
});

describe("useAutoAnalysis", () => {
  it("runs the analysis once in the published language on content.publish", async () => {
    api.get.mockResolvedValue({ config: { auto: "publish" }, assets: [] });
    const run = vi.fn<(language: string) => Promise<Report>>();
    run.mockResolvedValue(report);
    const { useAutoAnalysis } =
      await import("../../../src/panel/composables/auto");

    useAutoAnalysis({ auto: () => undefined, run });
    publish("de");
    await flushPromises();

    expect(run).toHaveBeenCalledExactlyOnceWith("de");
  });

  it.each([
    {
      condition: "the blueprint sets auto to false",
      auto: false,
      config: { auto: "publish" },
    },
    {
      condition: "neither the blueprint nor the config sets auto",
      auto: undefined,
      config: {},
    },
  ])(
    "stays silent on content.publish when $condition",
    async ({ auto, config }) => {
      api.get.mockResolvedValue({ config, assets: [] });
      const run = vi.fn<(language: string) => Promise<Report>>();
      run.mockResolvedValue(report);
      const { useAutoAnalysis } =
        await import("../../../src/panel/composables/auto");

      useAutoAnalysis({ auto: () => auto, run });
      publish("de");
      await flushPromises();

      expect(run).not.toHaveBeenCalled();
    },
  );

  it("runs once per publish for two participants on the same view and language", async () => {
    api.get.mockResolvedValue({ config: { auto: "publish" }, assets: [] });
    const run = vi.fn<(language: string) => Promise<Report>>();
    run.mockResolvedValue(report);
    const { useAutoAnalysis } =
      await import("../../../src/panel/composables/auto");

    useAutoAnalysis({ auto: () => undefined, run });
    useAutoAnalysis({ auto: () => undefined, run });
    publish("de");
    await flushPromises();
    publish("de");
    await flushPromises();

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("stops reacting to content.publish after onBeforeUnmount", async () => {
    api.get.mockResolvedValue({ config: { auto: "publish" }, assets: [] });
    const run = vi.fn<(language: string) => Promise<Report>>();
    run.mockResolvedValue(report);
    const { useAutoAnalysis } =
      await import("../../../src/panel/composables/auto");

    useAutoAnalysis({ auto: () => undefined, run });
    for (const hook of beforeUnmountHooks) hook();
    publish("de");
    await flushPromises();

    expect(run).not.toHaveBeenCalled();
  });
});

function createEventBus() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  return {
    on(event: string, handler: (payload: unknown) => void) {
      listeners.set(event, (listeners.get(event) ?? new Set()).add(handler));
    },
    off(event: string, handler: (payload: unknown) => void) {
      listeners.get(event)?.delete(handler);
    },
    emit(event: string, payload: unknown) {
      for (const handler of listeners.get(event) ?? []) handler(payload);
    },
    clear() {
      listeners.clear();
    },
  };
}

// Kirby emits `content.publish` with the values, the API path and the language.
function publish(language: string) {
  events.emit("content.publish", { values: {}, api: "/pages/about", language });
}
