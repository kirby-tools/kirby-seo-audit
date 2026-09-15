import type { Rating, Report } from "../../../src/panel/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "../utils";

const api = { get: vi.fn(), post: vi.fn() };
const panel = { view: { path: "pages/about" }, language: { code: "de" }, api };
const isEditable = { value: true };
const isKirby5 = vi.fn(() => true);

vi.mock("kirbyuse", async () => {
  const { baseKirbyuseMock } = await import("../helpers/mock-kirbyuse");
  return {
    ...baseKirbyuseMock(),
    usePanel: () => panel,
    useContent: () => ({ isEditable }),
    isKirby5,
  };
});

vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

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

beforeEach(() => {
  vi.resetModules();
  api.get.mockReset().mockResolvedValue(unratedRating);
  api.post.mockReset();
  isEditable.value = true;
  isKirby5.mockReturnValue(true);
});

describe("useRating", () => {
  it("requests the rating of the view in the current language on setup", async () => {
    api.get.mockResolvedValue(storedRating);
    const { rating } = await mountRating();

    expect(api.get).toHaveBeenCalledWith(
      "__seo-audit__/rating",
      { path: "pages/about" },
      { headers: { "x-language": "de" } },
    );
    expect(rating.value).toEqual(storedRating);
  });

  it("store posts the record of the report and exposes the server's answer", async () => {
    const serverRating: Rating = {
      seo: "ok",
      readability: "good",
      counts: { good: 2, ok: 1, bad: 1 },
      version: "changes",
      timestamp: 1_700_000_042,
      isStale: false,
    };
    api.post.mockResolvedValue(serverRating);
    const { rating, store } = await mountRating();

    await store(report, "changes", "de");

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
    );
    expect(rating.value).toEqual(serverRating);
  });

  it("store keeps a local record without a request when the model is not editable", async () => {
    isEditable.value = false;
    const { rating, store } = await mountRating();

    await store(report, "changes", "de");

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
});

async function mountRating() {
  const { useRating } = await import("../../../src/panel/composables/rating");
  const composable = useRating();
  await flushPromises();
  return composable;
}
