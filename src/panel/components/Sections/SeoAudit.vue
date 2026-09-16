<script lang="ts">
import type { LicenseStatus } from "@kirby-tools/licensing";
import type { AnalyzeOnTrigger } from "../../constants";
import type { AnalysisOptions } from "../../types";
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import {
  computed,
  isKirby5,
  ref,
  useContent,
  useI18n,
  usePanel,
  useSection,
  watch,
} from "kirbyuse";
import { section as sectionProps } from "kirbyuse/props";
import throttle from "throttleit";
import { useAnalysis, usePluginContext } from "../../composables";
import {
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} from "../../utils/analysis-options";
import AuditResult from "../Ui/AuditResult.vue";
import ReportMeta from "../Ui/ReportMeta.vue";
import ReportRatings from "../Ui/ReportRatings.vue";

const propsDefinition = {
  ...sectionProps,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
const props = defineProps(propsDefinition);

const _isKirby5 = isKirby5();
const panel = usePanel();
const { t } = useI18n();

const isZeroOneBuild = __ZERO_ONE__;

// #region Section props
const label = ref<string>();
const keyphrase = ref<string>();
const keyphraseField = ref<string>();
const synonyms = ref<string | string[]>();
const synonymsField = ref<string>();
const assessments = ref<string[]>([]);
const contentSelector = ref("body");
const links = ref<boolean>();
const persisted = ref<boolean>();
const analyzeOn = ref<AnalyzeOnTrigger | boolean | null>();
const logLevel = ref(resolveLogLevelIndex());
// #endregion

const isInitialized = ref(false);
const licenseStatus = ref<LicenseStatus>();
// The language `keyphrase` and `synonyms` were last resolved in, which lags
// behind a language switch until the section data reloads.
const keyphraseLanguage = ref<string>();
const isKeyphraseCurrent = computed(
  () => keyphraseLanguage.value === panel.language.code,
);

const { currentContent } = useContent();

const { analyze, isAnalyzing, rating, report } = useAnalysis({
  // A publish right after a language switch must not run with the
  // keyphrase of the language the editor left.
  resolveOptions: async () => {
    if (!isKeyphraseCurrent.value) {
      await updateSectionData();
    }

    return resolveAnalysisOptions();
  },
  contentSelector: () => contentSelector.value,
  analyzeOn: () => analyzeOn.value,
  storage: {
    scope: () => ({
      path: panel.view.path,
      language: panel.language.code,
      section: props.name!,
    }),
    persisted: () => persisted.value ?? false,
  },
});

watch(
  // Will be `null` in single language setups.
  () => panel.language.code,
  () => updateSectionData(),
);

updateSectionData(true);

// The playground re-runs the analysis whenever its own fields change.
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

async function updateSectionData(isInitializing = false) {
  const language = panel.language.code;
  const { load } = useSection();
  const [context, response] = await Promise.all([
    usePluginContext(),
    load({
      parent: props.parent!,
      name: props.name!,
    }),
  ]);

  // Set values once that don't need to be re-evaluated on the server when the language changes.
  if (isInitializing) {
    label.value =
      t(response.label) || panel.t("johannschopplich.seo-audit.label");
    keyphraseField.value = response.keyphraseField;
    synonymsField.value = response.synonymsField;
    assessments.value = response.assessments;
    contentSelector.value = response.contentSelector;
    links.value = response.links;
    persisted.value = response.persisted;
    analyzeOn.value = response.analyzeOn;
    logLevel.value = resolveLogLevelIndex(
      response.logLevel,
      context.config.logLevel,
    );

    licenseStatus.value =
      __PLAYGROUND__ || __ZERO_ONE__ ? "active" : context.licenseStatus;

    isInitialized.value = true;
  }

  // A response that arrives after a further language switch belongs to a
  // language the editor has left.
  if (panel.language.code !== language) {
    return;
  }

  // The server resolves these queries against the current language, so they
  // are re-read whenever it changes.
  keyphrase.value = response.keyphrase;
  synonyms.value = response.synonyms;
  keyphraseLanguage.value = language;
}

function resolveAnalysisOptions(): AnalysisOptions {
  return {
    assessments: __PLAYGROUND__
      ? currentContent.value.assessments
      : assessments.value,
    logLevel: logLevel.value,
    keyword: resolveKeyphrase(
      currentContent.value,
      keyphrase.value,
      keyphraseField.value,
    ),
    synonyms: resolveSynonyms(
      currentContent.value,
      synonyms.value,
      synonymsField.value,
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
  <k-section v-if="isInitialized" :label="label">
    <template
      v-if="licenseStatus !== undefined && !isZeroOneBuild"
      slot="options"
    >
      <LicensingButtonGroup
        label="Kirby SEO Audit"
        api-namespace="__seo-audit__"
        :license-status="licenseStatus"
        pricing-url="https://kirby.tools/seo-audit/buy"
      />
    </template>

    <div class="[&>*+*]:ksr-mt-[var(--spacing-4)]">
      <k-button-group layout="collapsed">
        <k-button
          :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
          :text="panel.t('johannschopplich.seo-audit.analyze')"
          variant="filled"
          theme="positive-icon"
          :disabled="isAnalyzing || !isKeyphraseCurrent"
          @click="analyzeAndNotify()"
        />
      </k-button-group>

      <div v-if="report">
        <k-box
          theme="passive"
          :style="
            _isKirby5
              ? {
                  '--box-color-text':
                    'light-dark(var(--theme-color-900), var(--color-gray-200))',
                  '--box-color-back':
                    'light-dark(var(--color-gray-250), var(--theme-color-back))',
                }
              : undefined
          "
          :class="[isAnalyzing && 'ksr-pointer-events-none ksr-animate-pulse']"
        >
          <AuditResult
            :key="report.timestamp"
            :results="report.results"
            :links="links"
            :class="[isAnalyzing && 'ksr-opacity-50']"
          >
            <template #header>
              <ReportRatings
                :ratings="report.ratings"
                class="ksr-mb-[var(--spacing-3)]"
              />
            </template>
          </AuditResult>
        </k-box>

        <p
          class="ksr-mt-[var(--spacing-2)] ksr-[font-size:var(--text-sm)] ksr-text-[var(--color-text-dimmed)]"
        >
          <ReportMeta
            :version="report.version"
            :timestamp="report.timestamp"
            :is-stale="rating?.isStale"
          />
        </p>
      </div>
    </div>
  </k-section>
</template>
