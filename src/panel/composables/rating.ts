import type { ContentVersion, Rating, Report } from "../types";
import { computed, isKirby5, ref, useContent, usePanel, watch } from "kirbyuse";
import { PLUGIN_RATING_API_ROUTE } from "../constants";
import { createLanguageRequestOptions } from "../utils/request";
import { toRatingRecord } from "../utils/seo-score";
import { useLogger } from "./logger";

// One record per view and language, shared by the button and the section on
// the same view, so a run in either updates both.
const records = ref<Record<string, Rating>>({});
const pendingLoads = new Map<string, Promise<void>>();

function recordKey(path: string, language?: string | null) {
  return `${path}:${language ?? ""}`;
}

export function useRating() {
  const _isKirby5 = isKirby5();
  const panel = usePanel();
  const logger = useLogger();
  const { isEditable } = useContent();

  const currentKey = computed(() =>
    recordKey(panel.view.path, panel.language.code),
  );
  const rating = computed(() => records.value[currentKey.value]);

  function load(language = panel.language.code) {
    if (!_isKirby5) return;

    const path = panel.view.path;
    const key = recordKey(path, language);

    if (pendingLoads.has(key)) return pendingLoads.get(key);

    const request = panel.api
      .get<Rating>(
        PLUGIN_RATING_API_ROUTE,
        { path },
        createLanguageRequestOptions(language),
      )
      .then((response) => {
        records.value = { ...records.value, [key]: response };
      })
      .catch((error) => logger.error(error))
      .finally(() => pendingLoads.delete(key));

    pendingLoads.set(key, request);

    return request;
  }

  /**
   * Stores the record of a run; without `update` on the model it stays in
   * this session, and the server keeps nothing.
   */
  async function store(
    report: Report,
    version: ContentVersion | undefined,
    language: string,
  ) {
    if (!_isKirby5) return;

    const path = panel.view.path;
    const record = toRatingRecord(report, version);
    let response: Rating = {
      ...record,
      timestamp: Math.floor(Date.now() / 1000),
      isStale: false,
    };

    if (isEditable.value) {
      try {
        response = await panel.api.post<Rating>(
          PLUGIN_RATING_API_ROUTE,
          { path, ...record },
          createLanguageRequestOptions(language),
        );
      } catch (error) {
        logger.error(error);
      }
    }

    records.value = {
      ...records.value,
      [recordKey(path, language)]: response,
    };
  }

  // A view button survives the move to another model of the same kind, so
  // the view path is watched along with the language.
  if (!__PLAYGROUND__) {
    watch(currentKey, () => load(), { immediate: true });
  }

  return {
    rating,
    store,
  };
}
