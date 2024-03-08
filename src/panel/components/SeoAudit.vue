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
import { LOG_LEVELS } from "../constants";
import { useCompatibility, useLogger, useSeoReview } from "../composables";
import { getHashedStorageKey } from "../utils/storage";
import { registerPluginAssets } from "../utils/assets";
import { prepareRemoteData } from "../utils/seo-review";
import { throttle } from "../utils/throttle";
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

useCompatibility();
const panel = usePanel();
const api = useApi();
const store = useStore();
const logger = useLogger();
const { performSeoReview } = useSeoReview();

// Non-reactive data
const storageKey = getHashedStorageKey(panel.view.path);
let previewUrl;

// Section props
const label = ref();
const keyphraseField = ref();
const assessments = ref();
const links = ref();
const persisted = ref();
const logLevel = ref();
// Section computed
const config = ref();
// Local data
const isInitialized = ref(false);
const isGenerating = ref(false);
const report = ref();

const currentContent = computed(() => store.getters["content/values"]());
const focusKeyphrase = computed(() =>
  keyphraseField.value ? currentContent.value[keyphraseField.value] || "" : "",
);

watch(
  // Will be `null` in single language setups
  () => panel.language.code,
  async () => {
    const data = await panel.api.get(panel.view.path, {
      select: ["previewUrl"],
    });
    previewUrl = data.previewUrl;
  },
  { immediate: true },
);

(async () => {
  const { load } = useSection();
  const response = await load({
    parent: props.parent,
    name: props.name,
  });
  label.value =
    t(response.label) || panel.t("johannschopplich.seo-audit.label");
  keyphraseField.value = response.keyphraseField;
  assessments.value = response.assessments;
  links.value = response.links;
  persisted.value = response.persisted;
  logLevel.value = LOG_LEVELS.indexOf(
    response.config.logLevel ?? response.logLevel,
  );
  config.value = response.config;

  registerPluginAssets(response.assets);

  if (persisted.value) {
    const persistedReport = JSON.parse(localStorage.getItem(storageKey));
    if (persistedReport) report.value = persistedReport;
  }

  isInitialized.value = true;
})();

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

const { format } = new Intl.DateTimeFormat(panel.translation.code, {
  dateStyle: "short",
  timeStyle: "short",
});

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
    const { locale, title, description, content } = await prepareRemoteData({
      html,
    });

    const result = await performSeoReview(content, {
      url,
      title,
      description,
      langCulture: locale,
      keyword: focusKeyphrase.value,
      synonyms: [],
      // eslint-disable-next-line no-undef
      assessments: __PLAYGROUND__
        ? currentContent.value.assessments
        : assessments.value,
    });

    report.value = {
      result: Object.fromEntries(
        Object.entries(result).map(([key, value]) => [key, sortResults(value)]),
      ),
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

  const { code, result } = await api.post("__seo-audit__/proxy", {
    url,
  });

  if (code !== 200) {
    logger.warn(
      `Response status code ${code} for URL ${url} is an indication that the error page is being analyzed.`,
    );
  }

  return result.html;
}
</script>

<template>
  <k-section v-if="isInitialized" :label="label">
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
