<script setup>
import { ref, useApi, useContent, usePanel } from "kirbyuse";
import { usePluginContext, useSeoReview } from "../../composables";
import { LOG_LEVELS } from "../../constants";
import { IncompatibleLocaleError } from "../../utils/error";
import { prepareContent } from "../../utils/seo-review";

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
    type: String,
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
  logLevel: {
    type: String,
    default: "warn",
    validator: (value) => LOG_LEVELS.includes(value),
  },
});

const panel = usePanel();
const api = useApi();
const { generateReport, fetchHtml } = useSeoReview();

const isAnalyzing = ref(false);

const { currentContent } = useContent();

async function analyze() {
  // eslint-disable-next-line no-undef
  if (__PLAYGROUND__) {
    if (!currentContent.value.targeturl) {
      panel.notification.error("Please enter a target URL to be analyzed.");
      return;
    }
  }

  panel.isLoading = true;
  isAnalyzing.value = true;

  const context = await usePluginContext();

  // eslint-disable-next-line no-undef
  const url = __PLAYGROUND__
    ? currentContent.value.targeturl
    : (await api.get(panel.view.path, { select: "previewUrl" })).previewUrl;

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
    const html = await fetchHtml(url);
    const { htmlDocument, language, title, description } =
      await prepareContent(html);

    const result = await generateReport(
      htmlDocument,
      props.contentSelector || "body",
      {
        // eslint-disable-next-line no-undef
        assessments: __PLAYGROUND__
          ? currentContent.value.assessments
          : props.assessments,
        logLevel: LOG_LEVELS.indexOf(
          context.config.logLevel || props.logLevel || "warn",
        ),
        // For Yoast SEO
        url,
        title,
        description,
        language,
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
        panel.t("johannschopplich.seo-audit.analyze.error"),
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
