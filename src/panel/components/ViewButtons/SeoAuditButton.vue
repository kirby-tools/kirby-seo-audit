<script setup>
import { computed, ref, useApi, useContent, usePanel } from "kirbyuse";
import {
  isZeroOneValid,
  useAutoAnalysis,
  useRating,
  useSeoReview,
} from "../../composables";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../../constants";
import { createLanguageRequestOptions } from "../../utils/request";
import { worstRating } from "../../utils/seo-score";

const props = defineProps({
  keyphrase: {
    type: String,
    default: "",
  },
  keyphraseField: {
    type: String,
    default: "",
  },
  synonyms: {
    type: [String, Array],
    default: "",
  },
  synonymsField: {
    type: String,
    default: "",
  },
  assessments: {
    type: Array,
    default: () => [],
  },
  contentSelector: {
    type: String,
    default: "body",
  },
  links: {
    type: Boolean,
    default: true,
  },
  logLevel: String,
  label: String,
  auto: {
    type: [String, Boolean],
    // Keeps Vue from casting an absent prop to `false` and overriding the global option.
    default: null,
  },
  theme: {
    type: String,
    default: "positive-icon",
  },
});

const BADGE_THEMES = {
  good: "positive",
  ok: "notice",
  bad: "negative",
  none: "passive",
};

const panel = usePanel();
const api = useApi();
const {
  generateReport,
  notifyReportError,
  resolveContentVersion,
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolvePreviewTarget,
  resolveSynonyms,
} = useSeoReview();

const { rating, store: storeRating } = useRating();

const isAnalyzing = ref(false);

// A stale rating keeps its color and gains a mark.
const badge = computed(() => {
  if (!rating.value?.timestamp) return undefined;

  return {
    theme: BADGE_THEMES[worstRating(rating.value)],
    text: rating.value.isStale ? "!" : undefined,
  };
});

const { currentContent } = useContent();

function hasKirbyQuery(value) {
  return typeof value === "string" && value.includes("{{");
}

/**
 * Runs the analysis in `language`; the report has the section's shape, so a
 * section on the same view can adopt the run.
 */
async function runAnalysis(language) {
  const content = currentContent.value;
  const logLevel = await resolveLogLevelIndex(props.logLevel);

  const version = __PLAYGROUND__ ? undefined : await resolveContentVersion();

  const [target, queriedProps] = __PLAYGROUND__
    ? [{ url: content.targeturl }, props]
    : await Promise.all([
        resolvePreviewTarget(language, version),
        // A view button's props reach the Panel unresolved, so the server
        // resolves the ones carrying a Kirby query.
        hasKirbyQuery(props.keyphrase) || hasKirbyQuery(props.synonyms)
          ? api.get(
              PLUGIN_BUTTON_OPTIONS_API_ROUTE,
              { path: panel.view.path },
              createLanguageRequestOptions(language),
            )
          : props,
      ]);

  const resolvedKeyphrase = resolveKeyphrase(
    queriedProps.keyphrase,
    props.keyphraseField,
    content,
  );
  const resolvedSynonyms = resolveSynonyms(
    queriedProps.synonyms,
    props.synonymsField,
    content,
  );

  const { results, ratings } = await generateReport(
    target,
    props.contentSelector || "body",
    {
      assessments: __PLAYGROUND__ ? content.assessments : props.assessments,
      logLevel,
      // Option names expected by Yoast SEO.
      keyword: resolvedKeyphrase,
      synonyms: resolvedSynonyms,
    },
  );

  const report = {
    results,
    ratings,
    version: target.version,
    timestamp: Date.now(),
  };

  if (!__PLAYGROUND__) {
    storeRating(report, target.version, language);
  }

  return report;
}

async function analyze() {
  if (__ZERO_ONE__ && !isZeroOneValid()) {
    return;
  }

  if (__PLAYGROUND__ && !currentContent.value.targeturl) {
    panel.notification.error("Please enter a target URL to be analyzed.");
    return;
  }

  // A language switch during the analysis must not mix the two languages, so
  // everything that depends on the language is read before the first `await`.
  const language = panel.language.code;
  panel.isLoading = true;
  isAnalyzing.value = true;

  try {
    const report = await runAnalysis(language);

    panel.dialog.open({
      component: "k-seo-audit-report-dialog",
      props: {
        report: report.results,
        ratings: report.ratings,
        version: report.version,
        timestamp: report.timestamp,
        links: props.links,
      },
    });
  } catch (error) {
    notifyReportError(error);
  } finally {
    panel.isLoading = false;
    isAnalyzing.value = false;
  }
}

if (!__PLAYGROUND__) {
  useAutoAnalysis({
    auto: () => props.auto,
    run: runAnalysis,
  });
}
</script>

<template>
  <k-button
    :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
    :text="label || panel.t('johannschopplich.seo-audit.label')"
    :theme="theme"
    :badge="badge"
    :disabled="isAnalyzing"
    variant="filled"
    size="sm"
    responsive
    @click="analyze()"
  >
  </k-button>
</template>
