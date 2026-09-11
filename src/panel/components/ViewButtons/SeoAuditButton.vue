<script setup>
import { ref, useApi, useContent, usePanel } from "kirbyuse";
import { isZeroOneValid, useSeoReview } from "../../composables";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../../constants";
import { createLanguageRequestOptions } from "../../utils/request";

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
  theme: {
    type: String,
    default: "positive",
  },
});

const panel = usePanel();
const api = useApi();
const {
  generateReport,
  notifyReportError,
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolvePreviewTarget,
  resolveSynonyms,
} = useSeoReview();

const isAnalyzing = ref(false);

const { currentContent } = useContent();

function hasKirbyQuery(value) {
  return typeof value === "string" && value.includes("{{");
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
  const content = currentContent.value;
  panel.isLoading = true;
  isAnalyzing.value = true;

  try {
    const logLevel = await resolveLogLevelIndex(props.logLevel);

    const [target, queriedProps] = __PLAYGROUND__
      ? [{ url: content.targeturl }, props]
      : await Promise.all([
          resolvePreviewTarget(language),
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

    const result = await generateReport(
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

    panel.dialog.open({
      component: "k-seo-audit-report-dialog",
      props: {
        report: result,
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
</script>

<template>
  <k-button
    :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
    :text="label || panel.t('johannschopplich.seo-audit.label')"
    :theme="theme"
    variant="filled"
    size="sm"
    responsive
    @click="analyze()"
  >
  </k-button>
</template>
