import type {
  AnalysisOptions,
  Rating,
  Report,
  ReportStorageScope,
} from "../types";
import {
  computed,
  isKirby5,
  onBeforeUnmount,
  ref,
  useContent,
  usePanel,
  watch,
} from "kirbyuse";
import { PLUGIN_RATING_API_ROUTE } from "../constants";
import { resolveAnalyzeOn } from "../utils/analyze-on";
import { createLanguageRequestOptions } from "../utils/request";
import { toRatingRecord } from "../utils/seo-score";
import { readStoredReport, writeStoredReport } from "../utils/storage";
import { useLogger } from "./logger";
import { usePluginContext } from "./plugin";
import { useSeoReview } from "./seo-review";
import { isZeroOneValid } from "./zero-one";

// Shared by the button and the section on the same view, so a run in either
// updates both; the reports exist only in this session.
const records = ref<Record<string, Rating>>({});
const reports = ref<Record<string, Report>>({});
const pendingLoads = new Map<string, Promise<void>>();
// One automatic run per view and language: the first participant to react
// runs it, and the others on the same view adopt its report.
const inFlightRuns = new Map<string, Promise<Report | undefined>>();

export function useAnalysis({
  resolveOptions,
  contentSelector,
  analyzeOn,
  storage,
}: {
  resolveOptions: (language: string) => Promise<AnalysisOptions>;
  contentSelector: () => string;
  analyzeOn: () => unknown;
  storage?: {
    scope: () => ReportStorageScope;
    isPersisted: () => boolean;
  };
}) {
  const _isKirby5 = isKirby5();
  const panel = usePanel();
  const logger = useLogger();
  const { currentContent, isEditable } = useContent();
  const { runAnalysis, notifyReportError } = useSeoReview();

  const isAnalyzing = ref(false);
  const currentKey = computed(() =>
    analysisKey(panel.view.path, panel.language.code),
  );
  const rating = computed(() => records.value[currentKey.value]);
  const report = computed(
    () => reports.value[currentKey.value] ?? readSeededReport(),
  );

  async function analyze(
    language = panel.language.code,
  ): Promise<Report | undefined> {
    if (__ZERO_ONE__ && !isZeroOneValid()) {
      return;
    }

    if (__PLAYGROUND__ && !currentContent.value.targeturl) {
      panel.notification.error("Please enter a target URL to be analyzed.");
      return;
    }

    try {
      return await run(language);
    } catch (error) {
      notifyReportError(error);
    }
  }

  async function run(language: string): Promise<Report | undefined> {
    // A view or language switch during the analysis must not move the run, so
    // the view path and the storage scope are read before the first `await`.
    const path = panel.view.path;
    const storageScope = storage?.scope();
    isAnalyzing.value = true;

    try {
      const options = await resolveOptions(language);
      const newReport = await runAnalysis(language, contentSelector(), options);
      reports.value = {
        ...reports.value,
        [analysisKey(path, language)]: newReport,
      };

      if (storageScope && storage?.isPersisted()) {
        writeStoredReport({ ...storageScope, language }, newReport);
      }

      if (!__PLAYGROUND__) {
        await storeRating(path, language, newReport);
      }

      // A run belongs to the language it started in.
      return panel.language.code === language ? newReport : undefined;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Stores the record of a run. Without `isEditable` the server would refuse
   * the write, so the record stays in this session.
   */
  async function storeRating(
    path: string,
    language: string,
    newReport: Report,
  ) {
    if (!_isKirby5) return;

    const record = toRatingRecord(newReport, newReport.version);
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
          "POST",
          true,
        );
      } catch (error) {
        logger.error(error);
      }
    }

    records.value = {
      ...records.value,
      [analysisKey(path, language)]: response,
    };
  }

  function readSeededReport() {
    if (!storage?.isPersisted()) return;

    const storedReport = readStoredReport(storage.scope());

    // A report stored before 3.5 carries no ratings and is discarded.
    return storedReport?.ratings ? storedReport : undefined;
  }

  function loadRating() {
    if (!_isKirby5) return;

    const path = panel.view.path;
    const language = panel.language.code;
    const key = analysisKey(path, language);

    if (pendingLoads.has(key)) return pendingLoads.get(key);

    const request = panel.api
      .get<Rating>(
        PLUGIN_RATING_API_ROUTE,
        { path },
        createLanguageRequestOptions(language),
        true,
      )
      .then((response) => {
        records.value = { ...records.value, [key]: response };
      })
      .catch((error) => logger.error(error))
      .finally(() => pendingLoads.delete(key));

    pendingLoads.set(key, request);

    return request;
  }

  async function onPublish({ language }: { language: string }) {
    try {
      const { config } = await usePluginContext();

      // The publish changed the content, so a stored rating is stale now.
      if (resolveAnalyzeOn(analyzeOn(), config.analyzeOn) !== "publish") {
        await loadRating();
        return;
      }

      const key = analysisKey(panel.view.path, language);
      if (inFlightRuns.has(key)) return;

      const pendingRun = run(language).finally(() => inFlightRuns.delete(key));
      inFlightRuns.set(key, pendingRun);
      await pendingRun;
    } catch (error) {
      logger.error(error);
    }
  }

  if (!__PLAYGROUND__) {
    // A view button survives the move to another model of the same kind, so
    // the view path is watched along with the language.
    watch(currentKey, () => loadRating(), { immediate: true });

    // Subscribed synchronously: an unmount before an async setup resolves
    // would call `off` first, which the event bus silently ignores.
    panel.events.on("content.publish", onPublish);

    onBeforeUnmount(() => {
      panel.events.off("content.publish", onPublish);
    });
  }

  return {
    analyze,
    isAnalyzing,
    rating,
    report,
  };
}

function analysisKey(path: string, language?: string | null) {
  return `${path}:${language ?? ""}`;
}
