<script>
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import {
  computed,
  isKirby5,
  ref,
  useApi,
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
import { DEFAULT_LOG_LEVEL, LOG_LEVELS } from "../../constants";
import { getHashedStorageKey } from "../../utils/storage";
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
const api = useApi();
const { t } = useI18n();
const {
  generateReport,
  notifyReportError,
  resolveKeyphrase,
  resolveSynonyms,
} = useSeoReview();

const storageKey = getHashedStorageKey(panel.view.path);
let previewUrl;

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

const { currentContent } = useContent();
const resolvedKeyphrase = computed(() =>
  resolveKeyphrase(keyphrase.value, keyphraseField.value),
);
const resolvedSynonyms = computed(() =>
  resolveSynonyms(synonyms.value, synonymsField.value),
);

watch(
  // Will be `null` in single language setups.
  () => panel.language.code,
  () => {
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
    logLevel.value = LOG_LEVELS.indexOf(
      response.logLevel && LOG_LEVELS.includes(response.logLevel)
        ? response.logLevel
        : (context.config.logLevel ?? DEFAULT_LOG_LEVEL),
    );

    licenseStatus.value =
      __PLAYGROUND__ || __ZERO_ONE__ ? "active" : context.licenseStatus;

    if (persisted.value) {
      const lastReport = JSON.parse(localStorage.getItem(storageKey));
      if (lastReport) report.value = lastReport;
    }

    isInitialized.value = true;
  }

  // These props are resolved Kirby queries.
  keyphrase.value = response.keyphrase;
  synonyms.value = response.synonyms;

  const data = await api.get(panel.view.path, { select: "previewUrl" });
  previewUrl = data.previewUrl;
}

async function analyze() {
  if (__ZERO_ONE__ && !isZeroOneValid()) {
    return;
  }

  if (__PLAYGROUND__) {
    if (!currentContent.value.targeturl) {
      panel.notification.error("Please enter a target URL to be analyzed.");
      return;
    }
  } else if (!previewUrl) {
    panel.notification.error(
      panel.t("johannschopplich.seo-audit.error.missingPreviewUrl"),
    );
    return;
  }

  const target = __PLAYGROUND__
    ? { url: currentContent.value.targeturl }
    : { url: previewUrl, path: panel.view.path };
  panel.isLoading = true;
  isAnalyzing.value = true;

  try {
    const result = await generateReport(target, contentSelector.value, {
      assessments: __PLAYGROUND__
        ? currentContent.value.assessments
        : assessments.value,
      logLevel: logLevel.value,
      // Option names expected by Yoast SEO.
      keyword: resolvedKeyphrase.value,
      synonyms: resolvedSynonyms.value,
    });

    report.value = {
      result,
      timestamp: Date.now(),
    };

    if (persisted.value) {
      localStorage.setItem(storageKey, JSON.stringify(report.value));
    }

    panel.notification.success({
      icon: "check",
      message: panel.t("johannschopplich.seo-audit.notification.analyzeSuccess"),
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

    <div class="ksr-space-y-4">
      <k-button-group layout="collapsed">
        <k-button
          :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
          :text="panel.t('johannschopplich.seo-audit.analyze')"
          variant="filled"
          theme="positive"
          :disabled="isAnalyzing"
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
