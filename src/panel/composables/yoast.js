import get from "just-safe-get";
import yoastseoDefaultConfig from "yoastseo/src/config/content/default.js";
import { computed, usePanel, useStore } from "kirbyuse";
import { getModule, interopDefault } from "../utils/assets";
import de from "../translations/yoast-seo/de.json";

const TRANSLATIONS = {
  de,
};

const ignoredAssessments = [
  "TaxonomyTextLengthAssessment",
  "UrlLengthAssessment",
  "UrlStopWordsAssessment",
];

const assessmentClassConfigKeyMap = {
  FleschReadingEaseAssessment: "fleschReading",
  SentenceLengthInTextAssessment: "sentenceLength",
};

export function useSeoReport() {
  const panel = usePanel();
  const store = useStore();
  const currentContent = computed(() => store.getters["content/values"]());

  const getYoastInsightsForContent = async (html, options) => {
    const YoastSEO = await getModule("yoastseo");
    const Jed = await getModule("jed");
    const pixelWidth = await interopDefault(getModule("string-pixel-width"));

    const paper = new YoastSEO.Paper(html, {
      keyword: options.keyword,
      url: options.url,
      permalink: options.permalink,
      title: options.title,
      titleWidth: options.title
        ? pixelWidth(options.title, { font: "arial", size: 20 })
        : undefined,
      synonyms: options.synonyms.join(","),
      description: options.description,
      locale: options.langCulture.replace("-", "_"),
    });
    const researcher = new YoastSEO.Researcher(paper);
    // eslint-disable-next-line no-undef
    const translations = __PLAYGROUND__
      ? TRANSLATIONS[currentContent.value.language]
      : TRANSLATIONS[panel.translation.code];
    const i18n = getI18n(Jed, translations);

    // console.log("YoastSEO.assessments", YoastSEO.assessments);

    const resolvedSelectedAssessments = options.assessments.map((i) => {
      i = i.toLowerCase();
      if (!i.endsWith("assessment")) i += "assessment";
      return i;
    });

    return Object.entries(YoastSEO.assessments).reduce(
      (acc, [category, assessments]) => {
        for (const [name, value] of Object.entries(assessments)) {
          if (ignoredAssessments.includes(name)) continue;
          if (
            resolvedSelectedAssessments.length > 0 &&
            !resolvedSelectedAssessments.includes(name.toLowerCase())
          )
            continue;

          if (
            typeof value === "object" &&
            Object.prototype.hasOwnProperty.call(value, "getResult")
          ) {
            const result = value.getResult(paper, researcher, i18n);
            if (result?.text) {
              acc[category].push({
                ...result,
                rating: YoastSEO.helpers.scoreToRating(result.score),
              });
            }
          } else if (typeof value === "function") {
            const configKey = get(assessmentClassConfigKeyMap, name, null);
            const config = configKey
              ? get(yoastseoDefaultConfig, configKey, {})
              : {};
            // eslint-disable-next-line new-cap
            const result = new value(config).getResult(paper, researcher, i18n);

            if (result?.text) {
              acc[category].push({
                ...result,
                rating: YoastSEO.helpers.scoreToRating(result.score),
              });
            }
          }
        }

        if (Object.prototype.hasOwnProperty.call(acc, category)) {
          acc[category].sort((a, b) => {
            if (a.rating === "feedback") return -1;
            if (b.rating === "feedback") return 1;
            return a.score < b.score ? -1 : 1;
          });
        }

        return acc;
      },
      {
        seo: [],
        readability: [],
      },
    );
  };

  return {
    getYoastInsightsForContent,
  };
}

function getI18n(Jed, translations) {
  return new Jed({
    domain: "js-text-analysis",
    locale_data: {
      "js-text-analysis": translations || { "": {} },
    },
  });
}
