import yoastseoDefaultConfig from "yoastseo/src/config/content/default.js";
import { computed, usePanel, useStore } from "kirbyuse";
import { getModule, interopDefault } from "../utils/assets";

const ignoredAssessments = [
  "TaxonomyTextLengthAssessment",
  "UrlLengthAssessment",
  "UrlStopWordsAssessment",
  // Produces wrong results (fixed upstream?)
  "SingleH1Assessment",
];

const keyphraseAssessments = [
  "FunctionWordsInKeyphraseAssessment",
  "IntroductionKeywordAssessment",
  "KeyphraseLengthAssessment",
  "KeywordDensityAssessment",
  // "KeywordStopWordsAssessment",
  "KeyphraseDistributionAssessment",
  "MetaDescriptionKeywordAssessment",
  "SubheadingsKeywordAssessment",
  "TitleKeywordAssessment",
  "UrlKeywordAssessment",
];

const assessmentConfigLookup = {
  FleschReadingEaseAssessment: "fleschReading",
  SentenceLengthInTextAssessment: "sentenceLength",
};

export function useSeoReview() {
  const panel = usePanel();
  const store = useStore();
  const currentContent = computed(() => store.getters["content/values"]());

  const performSeoReview = async (html, options) => {
    const YoastSEO = await getModule("yoastseo");
    const { Jed } = await getModule("jed");
    const pixelWidth = await interopDefault(getModule("string-pixel-width"));
    const YoastSEOTranslations = await interopDefault(
      getModule("yoastseo-translations"),
    );

    const paper = new YoastSEO.Paper(html, {
      keyword: options.keyword,
      synonyms: options.synonyms.join(","),
      url: new URL(options.url).pathname,
      permalink: options.url,
      title: options.title,
      titleWidth: options.title
        ? pixelWidth(options.title, { font: "arial", size: 20 })
        : undefined,
      description: options.description,
      locale: options.langCulture.replace("-", "_"),
    });
    const researcher = new YoastSEO.Researcher(paper);
    // eslint-disable-next-line no-undef
    const translations = __PLAYGROUND__
      ? YoastSEOTranslations[currentContent.value.language]
      : YoastSEOTranslations[panel.translation.code];
    const i18n = getI18n(Jed, translations);

    const selectedAssessments = options.assessments.map((i) => {
      i = i.toLowerCase();
      if (!i.endsWith("assessment")) i += "assessment";
      return i;
    });

    const assessmentResults = Object.entries(YoastSEO.assessments).reduce(
      (acc, [category, assessments]) => {
        for (const [key, CurrentAssessment] of Object.entries(assessments)) {
          // Some assessments have been depreciated
          if (ignoredAssessments.includes(key)) continue;

          // User-defined assessments
          if (
            selectedAssessments.length > 0 &&
            !selectedAssessments.includes(key.toLowerCase())
          )
            continue;

          // Skip keyphrase assessments if keyword is empty
          if (
            !options.keyword &&
            selectedAssessments.length === 0 &&
            keyphraseAssessments.includes(key)
          )
            continue;

          if (
            typeof CurrentAssessment === "object" &&
            Object.prototype.hasOwnProperty.call(CurrentAssessment, "getResult")
          ) {
            const result = CurrentAssessment.getResult(paper, researcher, i18n);
            acc[category].push(result);
          } else if (typeof CurrentAssessment === "function") {
            const configKey = assessmentConfigLookup[key];
            const config = configKey
              ? yoastseoDefaultConfig[configKey] ?? {}
              : {};

            const result = new CurrentAssessment(config).getResult(
              paper,
              researcher,
              i18n,
            );

            acc[category].push(result);
          }
        }

        return acc;
      },
      {
        seo: [],
        readability: [],
      },
    );

    const mappedResults = Object.fromEntries(
      Object.entries(assessmentResults).map(([category, results]) => [
        category,
        results.map((result) => mapResult(result, YoastSEO)).filter(Boolean),
      ]),
    );

    return mappedResults;
  };

  return {
    performSeoReview,
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

/**
 * Maps a single results to a result that can be interpreted
 * by yoast-component's `ContentAnalysis`
 */
function mapResult(result, YoastSEO) {
  if (!result.text) return;

  const mappedResult = {
    score: result.score,
    rating: YoastSEO.helpers.scoreToRating(result.score),
    hasMarks: result.hasMarks(),
    marker: result.getMarker(),
    text: result.text,
  };

  // Because of inconsistency between YoastSEO and yoast-components
  // if (mappedResult.rating === "ok") {
  //   mappedResult.rating = "OK";
  // }

  return mappedResult;
}
