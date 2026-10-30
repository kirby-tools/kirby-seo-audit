<script setup lang="ts">
import type { PropType } from "vue";
import type { AnalyzeOnTrigger, LogLevel } from "../constants";
import type { AnalysisOptions, ButtonOptionsResponse } from "../types";
import { useContent, usePanel } from "kirbyuse";
import { useAnalysis, usePluginContext } from "../composables";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../constants";
import {
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} from "../utils/analysis-options";
import ViewButtonBody from "./Ui/ViewButtonBody.vue";

// The view button props Kirby passes (`disabled`, `responsive`, …) would override the button's own.
defineOptions({ inheritAttrs: false });

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

const panel = usePanel();
const { currentContent } = useContent();

const { analyze, isAnalyzing, rating } = useAnalysis({
  resolveOptions: resolveAnalysisOptions,
  contentSelector: () => props.contentSelector || "body",
  analyzeOn: () => props.analyzeOn,
});

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value !== "";
}

async function resolveAnalysisOptions(
  language: string | null,
): Promise<AnalysisOptions> {
  const content = currentContent.value;

  // A view button's props reach the Panel unresolved, so the server resolves
  // a keyphrase or synonyms given as a non-empty string.
  const queriedProps: ButtonOptionsResponse =
    !__PLAYGROUND__ &&
    (isNonEmptyString(props.keyphrase) || isNonEmptyString(props.synonyms))
      ? await panel.api.get<ButtonOptionsResponse>(
          PLUGIN_BUTTON_OPTIONS_API_ROUTE,
          { path: panel.view.path },
          { language },
          true,
        )
      : props;
  const { config } = await usePluginContext();

  // The route answers `null` for a prop the blueprint doesn't set, like one
  // from `panel.viewButtons`, which the button then uses as written.
  return {
    assessments: __PLAYGROUND__ ? content.assessments : props.assessments,
    logLevel: resolveLogLevelIndex(props.logLevel, config.logLevel),
    keyword: resolveKeyphrase(
      content,
      queriedProps.keyphrase ?? props.keyphrase,
      props.keyphraseField,
    ),
    synonyms: resolveSynonyms(
      content,
      queriedProps.synonyms ?? props.synonyms,
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
  <ViewButtonBody
    :label="label || panel.t('johannschopplich.seo-audit.label')"
    :theme="theme"
    :rating="rating"
    :is-analyzing="isAnalyzing"
    @click="openReport()"
  />
</template>
