<script>
import { joinURL, withLeadingSlash } from "ufo";
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
import { useLocale, useSeoReport } from "../composables";
import { getHashedStorageKey } from "../utils/storage";
import { registerPluginAssets } from "../utils/assets";
import { prepareRemoteData } from "../utils/remote";
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

// Force Kirby v4
if (!window.panel.$api) {
  throw new Error("Kirby SEO Report requires Kirby 4");
}

const panel = usePanel();
const api = useApi();
const store = useStore();
const { getNonLocalizedPath } = useLocale();
const { getYoastInsightsForContent } = useSeoReport();

// Non-reactive data
const storageKey = getHashedStorageKey(panel.view.path);

// Section props
const label = ref();
const siteUrl = ref();
const keyphraseField = ref();
const assessments = ref();
const readability = ref();
const links = ref();
const logLevel = ref();
// Section computed
const config = ref();
// Local data
const isInitialized = ref(false);
const isGenerating = ref(false);
const url = ref();
const report = ref(JSON.parse(localStorage.getItem(storageKey)));

const currentContent = computed(() => store.getters["content/values"]());
const path = computed(() => {
  if (!url.value) return "";

  if (!panel.multilang) {
    const _url = new URL(url.value);
    return _url.pathname;
  }

  let path = getNonLocalizedPath(url.value);

  if (config.value?.languagePrefix === "exceptDefault") {
    if (!panel.language.default) {
      path = joinURL(panel.language.code, path);
    }
  } else {
    path = joinURL(panel.language.code, path);
  }

  return withLeadingSlash(path);
});
const focusKeyphrase = computed(() =>
  keyphraseField.value ? currentContent.value[keyphraseField.value] || "" : "",
);

watch(
  // Will be `null` in single language setups
  () => panel.language.code,
  async () => {
    const data = await panel.api.get(panel.view.path);
    url.value = data.url;
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
    t(response.label) || panel.t("johannschopplich.seo-report.label");
  siteUrl.value = response.siteUrl;
  keyphraseField.value = response.keyphraseField;
  assessments.value = response.assessments;
  readability.value = response.readability;
  links.value = response.links;
  logLevel.value = LOG_LEVELS.indexOf(
    response.config.logLevel ?? response.logLevel,
  );
  config.value = response.config;

  registerPluginAssets(response.assets);

  isInitialized.value = true;
})();

// Watch for content changes on the same page
// eslint-disable-next-line no-undef
if (__PLAYGROUND__) {
  watch(
    () => currentContent.value.assessments,
    (newValue, oldValue) => {
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        analyze();
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

  // eslint-disable-next-line no-undef
  const url = __PLAYGROUND__
    ? currentContent.value.targeturl
    : joinURL(siteUrl.value, path.value);
  panel.isLoading = true;
  isGenerating.value = true;

  try {
    const html = await fetchHtml(url);
    const { locale, title, description, content } = await prepareRemoteData({
      html,
    });

    const result = await getYoastInsightsForContent(content, {
      url,
      permalink: url,
      title,
      description,
      langCulture: locale,
      // eslint-disable-next-line no-undef
      keyword: __PLAYGROUND__
        ? currentContent.value.metakeyphrase
        : focusKeyphrase.value,
      synonyms: [],
      // eslint-disable-next-line no-undef
      assessments: __PLAYGROUND__
        ? currentContent.value.assessments
        : assessments.value,
    });

    report.value = {
      result,
      timestamp: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(report.value));
  } catch (error) {
    console.error(error);
    panel.notification.error(
      panel.t("johannschopplich.seo-report.generator.error"),
    );
  }

  panel.isLoading = false;
  isGenerating.value = false;
  panel.notification.success({
    icon: "check",
    message: panel.t("johannschopplich.seo-report.generator.success"),
  });
}

async function fetchHtml(url) {
  // Check if the current location has the same origin as the target URL
  if (location.origin === new URL(url).origin) {
    const response = await fetch(url);
    return await response.text();
  }

  const { result } = await api.post("__seo-report__/proxy", {
    url,
  });

  return result.html;
}
</script>

<template>
  <k-section v-if="isInitialized" :label="label">
    <div class="ksr-space-y-4">
      <k-button-group layout="collapsed">
        <k-button
          :icon="isGenerating ? 'loader' : 'seo-report-analyze'"
          :text="panel.t('johannschopplich.seo-report.analyze')"
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

            <div v-if="readability">
              <k-label class="ksr-mb-1">
                {{ panel.t("johannschopplich.seo-report.readability") }}
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
