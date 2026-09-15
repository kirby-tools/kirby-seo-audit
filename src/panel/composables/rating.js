import { isKirby5, ref, useContent, usePanel, watch } from "kirbyuse";
import { PLUGIN_RATING_API_ROUTE } from "../constants";
import { createLanguageRequestOptions } from "../utils/request";
import { toRatingRecord } from "../utils/seo-score";
import { useLogger } from "./logger";

export function useRating() {
  const _isKirby5 = isKirby5();
  const panel = usePanel();
  const logger = useLogger();
  const { isEditable } = useContent();

  const rating = ref();

  async function load(language = panel.language.code) {
    if (!_isKirby5) return;

    try {
      const response = await panel.api.get(
        PLUGIN_RATING_API_ROUTE,
        { path: panel.view.path },
        createLanguageRequestOptions(language),
      );

      // A response that arrives after a further language switch belongs to
      // a language the editor has left.
      if (panel.language.code === language) {
        rating.value = response;
      }
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * Stores the record of a run; without `update` on the model it stays in
   * this session, and the server keeps nothing.
   */
  async function store(report, version, language) {
    if (!_isKirby5) return;

    const record = toRatingRecord(report, version);
    let response = {
      ...record,
      timestamp: Math.floor(Date.now() / 1000),
      isStale: false,
    };

    if (isEditable.value) {
      try {
        response = await panel.api.post(
          PLUGIN_RATING_API_ROUTE,
          { path: panel.view.path, ...record },
          createLanguageRequestOptions(language),
        );
      } catch (error) {
        logger.error(error);
      }
    }

    if (panel.language.code === language) {
      rating.value = response;
    }
  }

  if (!__PLAYGROUND__) {
    load();
    watch(
      () => panel.language.code,
      (language) => load(language),
    );
  }

  return {
    rating,
    store,
  };
}
