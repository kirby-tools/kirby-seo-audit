<script setup lang="ts">
import type { PropType } from "vue";
import type { AnalyzeOnTrigger, LogLevel } from "../../constants";
import type { AnalysisOptions } from "../../types";
import { licenseProps } from "@kirby-tools/licensing";
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { useContent, usePanel } from "kirbyuse";
import {
  disabled as disabledProp,
  help as helpProp,
  id as idProp,
  name as nameProp,
} from "kirbyuse/props";
import throttle from "throttleit";
import { ref, watch } from "vue";
import {
  useAnalysis,
  useAuditLabels,
  usePluginContext,
} from "../../composables";
import {
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} from "../../utils/analysis-options";
import AuditField from "../Ui/AuditField.vue";

const props = defineProps({
  // Declared to keep `disabled` off `k-field`, so the field never looks disabled.
  ...disabledProp,
  ...helpProp,
  ...idProp,
  ...nameProp,
  label: {
    type: String,
    required: true,
  },
  keyphrase: String,
  keyphraseField: String,
  synonyms: [String, Array] as PropType<string | string[]>,
  synonymsField: String,
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
  persisted: {
    type: Boolean,
    default: true,
  },
  analyzeOn: {
    type: [String, Boolean] as PropType<AnalyzeOnTrigger | boolean | null>,
    // Keeps Vue from casting an absent prop to `false` and overriding the global option.
    default: null,
  },
  logLevel: String as PropType<LogLevel>,
  ...licenseProps,
});

const panel = usePanel();
const labels = useAuditLabels();
const hasLicenseButtons = !__PLAYGROUND__ && !__ZERO_ONE__;
const { currentContent } = useContent();

// The playground writes it from its own toggle.
const links = ref(props.links);

const { analyze, isAnalyzing, rating, report } = useAnalysis({
  resolveOptions: resolveAnalysisOptions,
  contentSelector: () => props.contentSelector,
  analyzeOn: () => props.analyzeOn,
  storage: {
    scope: () => ({
      path: panel.view.path,
      language: panel.language.code,
      field: String(props.name),
    }),
    isPersisted: () => props.persisted,
  },
});

if (__PLAYGROUND__) {
  const throttledAnalyze = throttle(analyzeAndNotify, 1000);
  watch(
    () => currentContent.value.assessments,
    (newValue, oldValue) => {
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        throttledAnalyze();
      }
    },
  );
  watch(
    () => currentContent.value.language,
    (newValue, oldValue) => {
      if (newValue !== oldValue) {
        analyzeAndNotify();
      }
    },
  );
  watch(
    () => currentContent.value.links,
    (value) => {
      links.value = value;
    },
  );
}

async function resolveAnalysisOptions(): Promise<AnalysisOptions> {
  const { config } = await usePluginContext();

  return {
    assessments: __PLAYGROUND__
      ? currentContent.value.assessments
      : props.assessments,
    logLevel: resolveLogLevelIndex(props.logLevel, config.logLevel),
    keyword: resolveKeyphrase(
      currentContent.value,
      props.keyphrase,
      props.keyphraseField,
    ),
    synonyms: resolveSynonyms(
      currentContent.value,
      props.synonyms,
      props.synonymsField,
    ),
  };
}

async function analyzeAndNotify() {
  const newReport = await analyze();

  if (!newReport) {
    return;
  }

  panel.notification.success({
    icon: "check",
    message: panel.t("johannschopplich.seo-audit.notification.analyzeSuccess"),
  });
}
</script>

<template>
  <AuditField
    :id="id"
    :help="help"
    :label="label"
    :name="name"
    :labels="labels"
    :is-analyzing="isAnalyzing"
    :results="report?.results"
    :ratings="report?.ratings"
    :version="report?.version"
    :timestamp="report?.timestamp"
    :is-stale="rating?.isStale"
    :links="links"
    @analyze="analyzeAndNotify()"
  >
    <template v-if="hasLicenseButtons" #options>
      <LicensingButtonGroup
        :dialog="licenseDialog"
        :license-status="licenseStatus"
        pricing-url="https://kirby.tools/seo-audit/buy"
      />
    </template>
  </AuditField>
</template>
