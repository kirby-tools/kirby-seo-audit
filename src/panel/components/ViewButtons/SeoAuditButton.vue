<script setup>
import { ref, useApi, useContent, usePanel } from "kirbyuse";
import {
  isZeroOneValid,
  usePluginContext,
  useSeoReview,
} from "../../composables";
import { DEFAULT_LOG_LEVEL, LOG_LEVELS } from "../../constants";

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

  const context = await usePluginContext();

  const target = __PLAYGROUND__
    ? { url: currentContent.value.targeturl }
    : {
        url: (await api.get(panel.view.path, { select: "previewUrl" }))
          .previewUrl,
        path: panel.view.path,
      };

  if (!__PLAYGROUND__ && !target.url) {
    panel.notification.error(
      panel.t("johannschopplich.seo-audit.error.missingPreviewUrl"),
    );
    panel.isLoading = false;
    isAnalyzing.value = false;
    return;
  }

  const resolvedKeyphrase = resolveKeyphrase(
    props.keyphrase,
    props.keyphraseField,
  );
  const resolvedSynonyms = resolveSynonyms(props.synonyms, props.synonymsField);

  try {
    const result = await generateReport(
      target,
      props.contentSelector || "body",
      {
        assessments: __PLAYGROUND__
          ? currentContent.value.assessments
          : props.assessments,
        logLevel: LOG_LEVELS.indexOf(
          props.logLevel && LOG_LEVELS.includes(props.logLevel)
            ? props.logLevel
            : (context.config.logLevel ?? DEFAULT_LOG_LEVEL),
        ),
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
