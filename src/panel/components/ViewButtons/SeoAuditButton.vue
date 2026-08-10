<script setup>
import { ref, useApi, useContent, usePanel } from "kirbyuse";
import { isZeroOneValid, useSeoReview } from "../../composables";
import { PLUGIN_BUTTON_OPTIONS_API_ROUTE } from "../../constants";

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
});

const panel = usePanel();
const api = useApi();
const {
  generateReport,
  notifyReportError,
  resolveKeyphrase,
  resolveLogLevelIndex,
  resolveSynonyms,
} = useSeoReview();

const isAnalyzing = ref(false);

const { currentContent } = useContent();

async function analyze() {
  if (__ZERO_ONE__ && !isZeroOneValid()) {
    return;
  }

  if (__PLAYGROUND__) {
    if (!currentContent.value.targeturl) {
      panel.notification.error("Please enter a target URL to be analyzed.");
      return;
    }
  }

  panel.isLoading = true;
  isAnalyzing.value = true;

  const logLevel = await resolveLogLevelIndex(props.logLevel);

  // A view button's props reach the Panel unresolved, so the server hands back
  // the ones that carry a Kirby query.
  const [target, queriedProps] = __PLAYGROUND__
    ? [{ url: currentContent.value.targeturl }, props]
    : await Promise.all([
        api
          .get(panel.view.path, { select: "previewUrl" })
          .then(({ previewUrl }) => ({
            url: previewUrl,
            path: panel.view.path,
          })),
        api.get(PLUGIN_BUTTON_OPTIONS_API_ROUTE, { path: panel.view.path }),
      ]);

  if (!__PLAYGROUND__ && !target.url) {
    panel.notification.error(
      panel.t("johannschopplich.seo-audit.error.missingPreviewUrl"),
    );
    panel.isLoading = false;
    isAnalyzing.value = false;
    return;
  }

  const resolvedKeyphrase = resolveKeyphrase(
    queriedProps.keyphrase,
    props.keyphraseField,
  );
  const resolvedSynonyms = resolveSynonyms(
    queriedProps.synonyms,
    props.synonymsField,
  );

  try {
    const result = await generateReport(
      target,
      props.contentSelector || "body",
      {
        assessments: __PLAYGROUND__
          ? currentContent.value.assessments
          : props.assessments,
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
    :text="panel.t('johannschopplich.seo-audit.label')"
    theme="positive"
    variant="filled"
    size="sm"
    responsive
    @click="analyze()"
  >
  </k-button>
</template>
