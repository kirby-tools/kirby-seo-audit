<script setup>
import { ref, useApi, useContent, usePanel } from "kirbyuse";
import {
  isZeroOneValid,
  usePluginContext,
  useSeoReview,
} from "../../composables";
import { DEFAULT_LOG_LEVEL, LOG_LEVELS } from "../../constants";
import { IncompatibleLocaleError } from "../../utils/error";

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
const { generateReport } = useSeoReview();

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

  const resolvedKeyphrase =
    props.keyphrase || currentContent.value[props.keyphraseField] || "";
  let resolvedSynonyms = [];

  if (props.synonyms || props.synonymsField) {
    const value = props.synonyms || currentContent.value[props.synonymsField];
    if (Array.isArray(value)) resolvedSynonyms = value;
    else if (typeof value === "string")
      resolvedSynonyms = value.split(",").map((i) => i.trim());
  }

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
        // For Yoast SEO
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
    console.error(error);

    if (error instanceof IncompatibleLocaleError) {
      panel.notification.error(
        panel.t("johannschopplich.seo-audit.error.incompatibleLocale", {
          locale: error.locale.toUpperCase(),
          assessment: error.assessment,
          compatibleLocales: error.compatibleLocales
            .map((i) => i.toUpperCase())
            .join(", "),
        }),
      );
    } else {
      panel.notification.error(
        panel.t("johannschopplich.seo-audit.notification.analyzeError"),
      );
    }
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
