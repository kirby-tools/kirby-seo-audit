<script>
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
import {
  isZeroOneValid,
  usePluginContext,
  useSeoReview,
} from "../../composables";
import { readStoredReport, writeStoredReport } from "../../utils/storage";
import AuditResult from "../Ui/AuditResult.vue";

const propsDefinition = {
  ...sectionProps,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup>
const props = defineProps(propsDefinition);

const _isKirby5 = isKirby5();
const panel = usePanel();
const { t } = useI18n();
const {
  generateReport,
  notifyReportError,
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolvePreviewTarget,
  resolveSynonyms,
} = useSeoReview();

const isZeroOneBuild = __ZERO_ONE__;

// #region Section props
const label = ref();
const keyphrase = ref();
const keyphraseField = ref();
const synonyms = ref();
const synonymsField = ref();
const assessments = ref();
const contentSelector = ref();
const links = ref();
const persisted = ref();
const logLevel = ref();
// #endregion

const isInitialized = ref(false);
const isAnalyzing = ref(false);
const licenseStatus = ref();
const report = ref();
// The language `keyphrase` and `synonyms` were last resolved in, which lags
// behind a language switch until the section data reloads.
const keyphraseLanguage = ref();
const isKeyphraseCurrent = computed(
  () => keyphraseLanguage.value === panel.language.code,
);

const { currentContent } = useContent();

watch(
  // Will be `null` in single language setups.
  () => panel.language.code,
  () => {
    loadStoredReport();
    updateSectionData();
  },
);

updateSectionData(true);

// The playground re-runs the analysis whenever its own fields change.
if (__PLAYGROUND__) {
  const throttledAnalyze = throttle(analyze, 1000);
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
        analyze();
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

const { format } = new Intl.DateTimeFormat(
  panel.translation.code.replace("_", "-"),
  {
    dateStyle: "short",
    timeStyle: "short",
  },
);

async function updateSectionData(isInitializing = false) {
  const language = panel.language.code;
  const { load } = useSection();
  const [context, response] = await Promise.all([
    usePluginContext(),
    load({
      parent: props.parent,
      name: props.name,
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
    logLevel.value = await resolveLogLevelIndex(response.logLevel);

    licenseStatus.value =
      __PLAYGROUND__ || __ZERO_ONE__ ? "active" : context.licenseStatus;

    loadStoredReport();

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

function getStorageScope() {
  return {
    path: panel.view.path,
    language: panel.language.code,
    section: props.name,
  };
}

function loadStoredReport() {
  report.value = persisted.value
    ? readStoredReport(getStorageScope())
    : undefined;
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
  const storageScope = getStorageScope();
  const resolvedKeyphrase = resolveKeyphrase(
    keyphrase.value,
    keyphraseField.value,
  );
  const resolvedSynonyms = resolveSynonyms(
    synonyms.value,
    synonymsField.value,
  );
  panel.isLoading = true;
  isAnalyzing.value = true;

  try {
    const target = __PLAYGROUND__
      ? { url: currentContent.value.targeturl }
      : await resolvePreviewTarget(language);
    const result = await generateReport(target, contentSelector.value, {
      assessments: __PLAYGROUND__
        ? currentContent.value.assessments
        : assessments.value,
      logLevel: logLevel.value,
      // Option names expected by Yoast SEO.
      keyword: resolvedKeyphrase,
      synonyms: resolvedSynonyms,
    });

    const newReport = {
      result,
      timestamp: Date.now(),
    };

    if (persisted.value) {
      writeStoredReport(storageScope, newReport);
    }

    // An analysis still running when the editor switched languages belongs to
    // the language it started in.
    const isCurrentLanguage = panel.language.code === language;
    if (isCurrentLanguage) {
      report.value = newReport;
    }

    // Unstored and no longer shown, the report is discarded, so nothing was
    // generated from the editor's point of view.
    if (!isCurrentLanguage && !persisted.value) {
      return;
    }

    panel.notification.success({
      icon: "check",
      message: panel.t(
        "johannschopplich.seo-audit.notification.analyzeSuccess",
      ),
    });
  } catch (error) {
    notifyReportError(error);
  } finally {
    panel.isLoading = false;
    isAnalyzing.value = false;
  }
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
          theme="positive"
          :disabled="isAnalyzing || !isKeyphraseCurrent"
          @click="analyze()"
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
          :class="[
            isAnalyzing &&
              'ksr-cusor-wait ksr-pointer-events-none ksr-animate-pulse',
          ]"
        >
          <AuditResult
            :key="report.timestamp"
            :report="report.result"
            :links="links"
            :class="[isAnalyzing && 'ksr-opacity-50']"
          />
        </k-box>

        <k-box theme="empty" icon="clock" class="ksr-border-transparent">
          {{ format(report.timestamp) }}
        </k-box>
      </div>
    </div>
  </k-section>
</template>
