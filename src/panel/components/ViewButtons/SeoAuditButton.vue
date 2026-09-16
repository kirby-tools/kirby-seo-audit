<script setup lang="ts">
import type { PropType } from "vue";
import type { AnalyzeOnTrigger, LogLevel } from "../../constants";
import type {
  AnalysisOptions,
  ButtonOptionsResponse,
  CategoryRating,
} from "../../types";
import { computed, useApi, useContent, usePanel } from "kirbyuse";
import { useAnalysis, usePluginContext } from "../../composables";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../../constants";
import {
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} from "../../utils/analysis-options";
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
    type: [String, Array] as PropType<string | string[]>,
    default: "",
  },
  synonymsField: {
    type: String,
    default: "",
  },
  assessments: {
    type: Array as PropType<string[]>,
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
  logLevel: String as PropType<LogLevel>,
  label: String,
  analyzeOn: {
    type: [String, Boolean] as PropType<AnalyzeOnTrigger | boolean | null>,
    // Keeps Vue from casting an absent prop to `false` and overriding the global option.
    default: null,
  },
  theme: {
    type: String,
    default: "positive-icon",
  },
});

const BADGE_THEMES: Record<CategoryRating, string> = {
  good: "positive",
  ok: "notice",
  bad: "negative",
  none: "passive",
};

const panel = usePanel();
const api = useApi();
const { currentContent } = useContent();

const { analyze, isAnalyzing, rating } = useAnalysis({
  resolveOptions: resolveAnalysisOptions,
  contentSelector: () => props.contentSelector || "body",
  analyzeOn: () => props.analyzeOn,
});

const badge = computed(() => {
  if (!rating.value?.timestamp) return undefined;

  return {
    theme: BADGE_THEMES[worstRating(rating.value)],
    text: rating.value.isStale ? "!" : undefined,
  };
});

function hasKirbyQuery(value: unknown) {
  return typeof value === "string" && value.includes("{{");
}

async function resolveAnalysisOptions(
  language: string,
): Promise<AnalysisOptions> {
  const content = currentContent.value;

  // A view button's props reach the Panel unresolved, so the server resolves
  // the ones carrying a Kirby query.
  const queriedProps: ButtonOptionsResponse =
    !__PLAYGROUND__ &&
    (hasKirbyQuery(props.keyphrase) || hasKirbyQuery(props.synonyms))
      ? await api.get<ButtonOptionsResponse>(
          PLUGIN_BUTTON_OPTIONS_API_ROUTE,
          { path: panel.view.path },
          createLanguageRequestOptions(language),
          true,
        )
      : props;
  const { config } = await usePluginContext();

  return {
    assessments: __PLAYGROUND__ ? content.assessments : props.assessments,
    logLevel: resolveLogLevelIndex(props.logLevel, config.logLevel),
    keyword: resolveKeyphrase(
      content,
      queriedProps.keyphrase,
      props.keyphraseField,
    ),
    synonyms: resolveSynonyms(
      content,
      queriedProps.synonyms,
      props.synonymsField,
    ),
  };
}

async function openReport() {
  const report = await analyze();

  if (!report) {
    return;
  }

  panel.dialog.open({
    component: "k-seo-audit-report-dialog",
    props: {
      results: report.results,
      ratings: report.ratings,
      version: report.version,
      timestamp: report.timestamp,
      links: props.links,
    },
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
    @click="openReport()"
  >
  </k-button>
</template>
