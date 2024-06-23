<script>
import {
  computed,
  ref,
  useApi,
  usePanel,
  useSection,
  useStore,
  watch,
} from "kirbyuse";
import { section } from "kirbyuse/props";
import throttle from "throttleit";
import { useLicense } from "@kirby-tools/licensing";
import { LOG_LEVELS } from "../constants";
import { useLogger, useSeoReview } from "../composables";
import { getHashedStorageKey } from "../utils/storage";
import { registerPluginAssets } from "../utils/assets";
import { prepareContent } from "../utils/seo-review";
import SeoResultEntry from "./SeoResultEntry.vue";

const propsDefinition = {
  ...section,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup>
const props = defineProps(propsDefinition);

const panel = usePanel();
const api = useApi();
const store = useStore();
const logger = useLogger();
const { generateReport } = useSeoReview();
const { openLicenseModal, assertActivationIntegrity } = useLicense({
  label: "Kirby SEO Audit",
  apiNamespace: "__seo-audit__",
});

// Non-reactive data
const storageKey = getHashedStorageKey(panel.view.path);
let previewUrl;

// Section props
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
// Section computed
const config = ref();
const license = ref();
// Local data
const isInitialized = ref(false);
const isGenerating = ref(false);
const licenseButtonGroup = ref();
const report = ref();

const currentContent = computed(() => store.getters["content/values"]());
const resolvedKeyphrase = computed(
  () => keyphrase.value || currentContent.value[keyphraseField.value] || "",
);
const resolvedSynonyms = computed(() => {
  if (!synonyms.value && !synonymsField.value) return [];
  const value = synonyms.value || currentContent.value[synonymsField.value];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").map((i) => i.trim());
  return [];
});

watch(
  // Will be `null` in single language setups
  () => panel.language.code,
  () => {
    updateSectionData();
  },
);

updateSectionData(true);

// Watch for content changes on the same page
// eslint-disable-next-line no-undef
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
  const response = await load({
    parent: props.parent,
    name: props.name,
  });

  // Set values once that don't need to be re-evaluated on the server
  // when the language changes
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
      response.config.logLevel ?? response.logLevel,
    );
    config.value = response.config;
    license.value =
      // eslint-disable-next-line no-undef
      __PLAYGROUND__ && window.location.hostname === "try.kirbyseo.com"
        ? true
        : response.license;

    registerPluginAssets(response.assets);

    if (persisted.value) {
      const persistedReport = JSON.parse(localStorage.getItem(storageKey));
      if (persistedReport) report.value = persistedReport;
    }

    assertActivationIntegrity({
      component: licenseButtonGroup,
      license: license.value,
    });
    isInitialized.value = true;
  }

  // These props are resolved Kirby queries
  keyphrase.value = response.keyphrase;
  synonyms.value = response.synonyms;

  const data = await api.get(panel.view.path, { select: "previewUrl" });
  previewUrl = data.previewUrl;
}

function t(value) {
  if (!value || typeof value === "string") return value;
  return value[panel.translation.code] ?? Object.values(value)[0];
}

async function analyze() {
  // eslint-disable-next-line no-undef
  if (__PLAYGROUND__) {
    if (!currentContent.value.targeturl) {
      panel.notification.error("Please enter a target URL to be analyzed.");
      return;
    }
  }

  if (!previewUrl) {
    panel.notification.error(
      panel.t("johannschopplich.seo-audit.error.missingPreviewUrl"),
    );
    return;
  }

  // eslint-disable-next-line no-undef
  const url = __PLAYGROUND__ ? currentContent.value.targeturl : previewUrl;
  panel.isLoading = true;
  isGenerating.value = true;

  try {
    const html = await fetchHtml(url);
    const { htmlDocument, locale, title, description } =
      await prepareContent(html);

    const result = await generateReport(htmlDocument, contentSelector.value, {
      // eslint-disable-next-line no-undef
      assessments: __PLAYGROUND__
        ? currentContent.value.assessments
        : assessments.value,
      // For Yoast SEO
      url,
      title,
      description,
      langCulture: locale,
      keyword: resolvedKeyphrase.value,
      synonyms: resolvedSynonyms.value,
    });

    for (const key of Object.keys(result)) {
      result[key] = sortResults(result[key]);
    }

    report.value = {
      result,
      timestamp: Date.now(),
    };

    if (persisted.value) {
      localStorage.setItem(storageKey, JSON.stringify(report.value));
    }
  } catch (error) {
    console.error(error);
    panel.notification.error(
      panel.t("johannschopplich.seo-audit.analyze.error"),
    );
  }

  panel.isLoading = false;
  isGenerating.value = false;
  panel.notification.success({
    icon: "check",
    message: panel.t("johannschopplich.seo-audit.analyze.success"),
  });
}

function sortResults(results) {
  return results.toSorted((a, b) => {
    if (a.rating === "feedback") return -1;
    if (b.rating === "feedback") return 1;
    return a.score < b.score ? -1 : 1;
  });
}

async function fetchHtml(url) {
  // Check if the current location has the same origin as the target URL
  if (location.origin === new URL(url).origin) {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn(
        `Response status code ${response.status} for URL ${url} is an indication that the error page is being analyzed.`,
      );
    }
    return await response.text();
  }

  const { code, html } = await api.post("__seo-audit__/proxy", {
    url,
  });

  if (code !== 200) {
    logger.warn(
      `Response status code ${code} for URL ${url} is an indication that the error page is being analyzed.`,
    );
  }

  return html;
}

async function handleRegistration() {
  const { isRegistered } = await openLicenseModal();
  if (isRegistered) {
    license.value = true;
  }
}
</script>

<template>
  <k-section v-if="isInitialized" :label="label">
    <k-button-group
      v-if="license === false"
      ref="licenseButtonGroup"
      slot="options"
      layout="collapsed"
    >
      <k-button
        theme="love"
        variant="filled"
        size="xs"
        link="https://kirbyseo.com/buy"
        target="_blank"
        :text="panel.t('johannschopplich.seo-audit.license.buy')"
      />
      <k-button
        theme="love"
        variant="filled"
        size="xs"
        icon="key"
        :text="panel.t('johannschopplich.seo-audit.license.activate')"
        @click="handleRegistration()"
      />
    </k-button-group>

    <div class="ksr-space-y-4">
      <k-button-group layout="collapsed">
        <k-button
          :icon="isGenerating ? 'loader' : 'seo-audit-analyze'"
          :text="panel.t('johannschopplich.seo-audit.analyze')"
          variant="filled"
          size="sm"
          theme="positive"
          :disabled="isGenerating"
          @click="analyze()"
        />
      </k-button-group>

      <div v-if="report">
        <k-box
          theme="passive"
          style="--link-color: var(--color-text)"
          :class="[
            isGenerating &&
              'ksr-cusor-wait ksr-pointer-events-none ksr-animate-pulse',
          ]"
        >
          <k-text
            class="ksr-space-y-4"
            :class="[isGenerating && 'ksr-opacity-50']"
          >
            <div v-if="report.result.seo.length > 0">
              <div v-for="(item, index) in report.result.seo" :key="index">
                <SeoResultEntry :result="item" :links="links" />
              </div>
            </div>

            <div v-if="report.result.readability.length > 0">
              <k-label
                class="ksr-mb-1"
                :style="{
                  color: 'var(--color-text)',
                }"
              >
                {{ panel.t("johannschopplich.seo-audit.readability") }}
              </k-label>
              <div
                v-for="(item, index) in report.result.readability"
                :key="index"
              >
                <SeoResultEntry :result="item" :links="links" />
              </div>
            </div>
          </k-text>
        </k-box>

        <k-box theme="empty" icon="clock" class="ksr-border-transparent">
          {{ format(report.timestamp) }}
        </k-box>
      </div>
    </div>
  </k-section>
</template>
