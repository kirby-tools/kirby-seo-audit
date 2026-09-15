import type {
  AnalysisOptions,
  PluginConfig,
  Rating,
  Report,
  ReportStorageScope,
} from "../../../src/panel/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markRaw, reactive } from "vue";
import {
  readStoredReport,
  writeStoredReport,
} from "../../../src/panel/utils/storage";
import { flushPromises } from "../helpers/flush-promises";

const api = { get: vi.fn(), post: vi.fn() };
const events = createEventBus();
// Reactive like the Panel's own state, so a language switch reaches the computed refs.
const panel = reactive({
  view: { path: "pages/about" },
  language: { code: "de" },
  api: markRaw(api),
  events: markRaw(events),
});
const isEditable = { value: true };
const isKirby5 = vi.fn(() => true);
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
const beforeUnmountHooks: Array<() => void> = [];
const runAnalysis =
  vi.fn<
    (
      language: string,
      contentSelector: string,
      options: AnalysisOptions,
    ) => Promise<Report>
  >();
const notifyReportError = vi.fn();
// Node's own `localStorage` shadows happy-dom's and stays empty without a storage file.
const storedItems = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storedItems.get(key) ?? null,
  setItem: (key: string, value: string) => storedItems.set(key, value),
});

let pluginConfig: PluginConfig;
let ratingResponse: Rating;

vi.mock("kirbyuse", async () => {
  const { baseKirbyuseMock } = await import("../helpers/mock-kirbyuse");
  return {
    ...baseKirbyuseMock(),
    createLogger: () => logger,
    usePanel: () => panel,
    useContent: () => ({ isEditable }),
    isKirby5,
    onBeforeUnmount: (hook: () => void) => beforeUnmountHooks.push(hook),
    registerPluginAssets: vi.fn(),
  };
});

vi.mock("../../../src/panel/composables/seo-review", () => ({
  useSeoReview: () => ({ runAnalysis, notifyReportError }),
}));

const options: AnalysisOptions = {
  assessments: [],
  logLevel: 1,
  keyword: "",
  synonyms: [],
};

const unratedRating: Rating = {
  seo: null,
  readability: null,
  counts: { good: 0, ok: 0, bad: 0 },
  version: null,
  timestamp: null,
  isStale: false,
};

const storedRating: Rating = {
  seo: "good",
  readability: "ok",
  counts: { good: 3, ok: 1, bad: 0 },
  version: "latest",
  timestamp: 1_699_000_000,
  isStale: true,
};

const report: Report = {
  results: {
    seo: [
      { score: 9, rating: "good", text: "Long enough" },
      { score: 3, rating: "bad", text: "No keyphrase in the title" },
      { score: 0, rating: "feedback", text: "Set a keyphrase first" },
    ],
    readability: [
      { score: 9, rating: "good", text: "Short sentences" },
      { score: 6, rating: "ok", text: "Few transition words" },
    ],
  },
  ratings: {
    seo: { score: 67, rating: "ok" },
    readability: { score: 90, rating: "good" },
  },
  version: "changes",
  timestamp: 1_700_000_000,
};

const storedReport: Report = {
  ...report,
  timestamp: 1_699_500_000,
};

const storageScope: ReportStorageScope = {
  path: "pages/about",
  language: "de",
  section: "seo",
};

beforeEach(() => {
  vi.resetModules();
  vi.setSystemTime(1_700_000_000_000);
  pluginConfig = { auto: "publish" };
  ratingResponse = unratedRating;
  api.get
    .mockReset()
    .mockImplementation(async (path: string) =>
      path === "__seo-audit__/context"
        ? { config: pluginConfig, assets: [] }
        : ratingResponse,
    );
  api.post.mockReset();
  runAnalysis.mockReset().mockResolvedValue(report);
  notifyReportError.mockReset();
  logger.error.mockReset();
  events.clear();
  beforeUnmountHooks.length = 0;
  panel.view.path = "pages/about";
  panel.language.code = "de";
  isEditable.value = true;
  isKirby5.mockReturnValue(true);
  storedItems.clear();
  window.panel = panel as unknown as Window["panel"];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAnalysis", () => {
  it("requests the rating of the view in the current language on setup", async () => {
    ratingResponse = storedRating;
    const { rating } = await mountAnalysis();

    expect(api.get).toHaveBeenCalledWith(
      "__seo-audit__/rating",
      { path: "pages/about" },
      { headers: { "x-language": "de" } },
      true,
    );
    expect(rating.value).toEqual(storedRating);
  });

  it("analyze runs with the resolved options and the content selector", async () => {
    const { analyze } = await mountAnalysis();

    await expect(analyze()).resolves.toBe(report);

    expect(runAnalysis).toHaveBeenCalledExactlyOnceWith("de", "main", options);
  });

  it("analyze posts the record of the report and exposes the server's answer as rating", async () => {
    const serverRating: Rating = {
      seo: "ok",
      readability: "good",
      counts: { good: 2, ok: 1, bad: 1 },
      version: "changes",
      timestamp: 1_700_000_042,
      isStale: false,
    };
    api.post.mockResolvedValue(serverRating);
    const { analyze, rating } = await mountAnalysis();

    await analyze();

    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "__seo-audit__/rating",
      {
        path: "pages/about",
        seo: "ok",
        readability: "good",
        counts: { good: 2, ok: 1, bad: 1 },
        version: "changes",
      },
      { headers: { "x-language": "de" } },
      "POST",
      true,
    );
    expect(rating.value).toEqual(serverRating);
  });

  it("analyze exposes the report of the run as report for the view and language", async () => {
    api.post.mockResolvedValue(storedRating);
    const { analyze, report: currentReport } = await mountAnalysis();

    await analyze();

    expect(currentReport.value).toBe(report);
  });

  it("analyze keeps a local record without a request when the model is not editable", async () => {
    isEditable.value = false;
    const { analyze, rating } = await mountAnalysis();

    await analyze();

    expect(api.post).not.toHaveBeenCalled();
    expect(rating.value).toEqual({
      seo: "ok",
      readability: "good",
      counts: { good: 2, ok: 1, bad: 1 },
      version: "changes",
      timestamp: 1_700_000_000,
      isStale: false,
    });
  });

  it("analyze runs in the language it started in after a switch during resolveOptions", async () => {
    const { analyze } = await mountAnalysis({
      resolveOptions: async () => {
        panel.language.code = "en";
        return options;
      },
    });

    await analyze();

    expect(runAnalysis).toHaveBeenCalledExactlyOnceWith("de", "main", options);
  });

  it("analyze sets isAnalyzing during the run and clears it after", async () => {
    const pendingRun = Promise.withResolvers<Report>();
    runAnalysis.mockReturnValue(pendingRun.promise);
    const { analyze, isAnalyzing } = await mountAnalysis();

    const pendingAnalysis = analyze();
    await flushPromises();
    expect(isAnalyzing.value).toBe(true);

    pendingRun.resolve(report);
    await pendingAnalysis;
    expect(isAnalyzing.value).toBe(false);
  });

  it("analyze notifies a failed run and resolves to undefined", async () => {
    const error = new Error("Preview unreachable");
    runAnalysis.mockRejectedValue(error);
    const { analyze, isAnalyzing } = await mountAnalysis();

    await expect(analyze()).resolves.toBeUndefined();

    expect(notifyReportError).toHaveBeenCalledExactlyOnceWith(error);
    expect(isAnalyzing.value).toBe(false);
  });

  it("analyze resolves to undefined after a language switch and keeps the report under the start language", async () => {
    const pendingRun = Promise.withResolvers<Report>();
    runAnalysis.mockReturnValue(pendingRun.promise);
    const { analyze, report: currentReport } = await mountAnalysis();

    const pendingAnalysis = analyze();
    panel.language.code = "en";
    pendingRun.resolve(report);

    await expect(pendingAnalysis).resolves.toBeUndefined();
    expect(currentReport.value).toBeUndefined();

    panel.language.code = "de";
    expect(currentReport.value).toBe(report);
  });

  it("runs the analysis once in the published language on content.publish", async () => {
    await mountAnalysis();

    publish("en");
    await flushPromises();

    expect(runAnalysis).toHaveBeenCalledExactlyOnceWith("en", "main", options);
  });

  it.each([
    {
      condition: "the blueprint sets auto to false",
      auto: false,
      config: { auto: "publish" } satisfies PluginConfig,
    },
    {
      condition: "neither the blueprint nor the config sets auto",
      auto: undefined,
      config: {} satisfies PluginConfig,
    },
  ])(
    "stays silent on content.publish when $condition",
    async ({ auto, config }) => {
      pluginConfig = config;
      await mountAnalysis({ auto });

      publish("de");
      await flushPromises();

      expect(runAnalysis).not.toHaveBeenCalled();
    },
  );

  it("reloads the rating on content.publish when auto is off", async () => {
    pluginConfig = {};
    await mountAnalysis();
    api.get.mockClear();
    ratingResponse = { ...storedRating, isStale: true };

    publish("de");
    await flushPromises();

    expect(runAnalysis).not.toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledWith(
      "__seo-audit__/rating",
      { path: "pages/about" },
      { headers: { "x-language": "de" } },
      true,
    );
  });

  it("runs once per publish for two participants on the same view and language", async () => {
    await mountAnalysis();
    await mountAnalysis();

    publish("de");
    await flushPromises();
    publish("de");
    await flushPromises();

    expect(runAnalysis).toHaveBeenCalledTimes(2);
  });

  it("logs a failed automatic run without a notification", async () => {
    const error = new Error("Preview unreachable");
    runAnalysis.mockRejectedValue(error);
    await mountAnalysis();

    publish("de");
    await flushPromises();

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(error);
    expect(notifyReportError).not.toHaveBeenCalled();
  });

  it("a run by another participant on the same view reaches report", async () => {
    const participant = await mountAnalysis();
    const { analyze } = await mountAnalysis();

    await analyze();

    expect(participant.report.value).toBe(report);
  });

  it("seeds report from storage when persisted", async () => {
    writeStoredReport(storageScope, storedReport);
    const { report: currentReport } = await mountAnalysis({
      storage: { scope: () => storageScope, persisted: () => true },
    });

    expect(currentReport.value).toEqual(storedReport);
  });

  it("leaves report empty when not persisted", async () => {
    writeStoredReport(storageScope, storedReport);
    const { report: currentReport } = await mountAnalysis({
      storage: { scope: () => storageScope, persisted: () => false },
    });

    expect(currentReport.value).toBeUndefined();
  });

  it("discards a stored report without ratings", async () => {
    const { ratings, ...reportBefore35 } = storedReport;
    writeStoredReport(storageScope, reportBefore35 as Report);
    const { report: currentReport } = await mountAnalysis({
      storage: { scope: () => storageScope, persisted: () => true },
    });

    expect(currentReport.value).toBeUndefined();
  });

  it("analyze writes the report to storage under its start language", async () => {
    const pendingRun = Promise.withResolvers<Report>();
    runAnalysis.mockReturnValue(pendingRun.promise);
    const { analyze } = await mountAnalysis({
      storage: {
        scope: () => ({ ...storageScope, language: panel.language.code }),
        persisted: () => true,
      },
    });

    const pendingAnalysis = analyze();
    panel.language.code = "en";
    pendingRun.resolve(report);
    await pendingAnalysis;

    expect(readStoredReport(storageScope)).toEqual(report);
    expect(
      readStoredReport({ ...storageScope, language: "en" }),
    ).toBeUndefined();
  });

  it("stops reacting to content.publish after onBeforeUnmount", async () => {
    await mountAnalysis();

    for (const hook of beforeUnmountHooks) hook();
    publish("de");
    await flushPromises();

    expect(runAnalysis).not.toHaveBeenCalled();
  });
});

async function mountAnalysis({
  auto,
  resolveOptions = async () => options,
  storage,
}: {
  auto?: unknown;
  resolveOptions?: (language: string) => Promise<AnalysisOptions>;
  storage?: { scope: () => ReportStorageScope; persisted: () => boolean };
} = {}) {
  const { useAnalysis } =
    await import("../../../src/panel/composables/analysis");
  const composable = useAnalysis({
    resolveOptions,
    contentSelector: () => "main",
    auto: () => auto,
    storage,
  });
  await flushPromises();
  return composable;
}

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
