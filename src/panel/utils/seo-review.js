/* eslint-disable unicorn/prefer-dom-node-text-content */
import yoastseoDefaultConfig from "yoastseo/src/config/content/default.js";
import { langCultureMap } from "../constants";
import { getModule, interopDefault } from "./assets";
import { singleH1 } from "./assessments";

export const assessments = {
  seo: {
    SingleH1: singleH1,
  },
};

const yoastIgnoredAssessments = [
  "TaxonomyTextLengthAssessment",
  "UrlLengthAssessment",
  "UrlStopWordsAssessment",
  // Produces incorrect results
  "SingleH1Assessment",
];

const yoastAssessmentConfigLookup = {
  FleschReadingEaseAssessment: "fleschReading",
  SentenceLengthInTextAssessment: "sentenceLength",
};

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

export async function performYoastSeoReview({ html, options, translations }) {
  const YoastSEO = await getModule("yoastseo");
  const { Jed } = await getModule("jed");
  const pixelWidth = await interopDefault(getModule("string-pixel-width"));

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
  const i18n = getI18n(Jed, translations);

  const results = Object.entries(YoastSEO.assessments).reduce(
    (acc, [category, assessments]) => {
      for (const [key, CurrentAssessment] of Object.entries(assessments)) {
        // Some assessments have been depreciated
        if (yoastIgnoredAssessments.includes(key)) continue;

        // Skip keyphrase assessments if keyword is empty
        if (
          !options.keyword &&
          options.assessments.length === 0 &&
          keyphraseAssessments.includes(key)
        )
          continue;

        // Handle user-defined assessments
        if (
          options.assessments.length > 0 &&
          !options.assessments.includes(key.toLowerCase())
        )
          continue;

        if (
          typeof CurrentAssessment === "object" &&
          Object.prototype.hasOwnProperty.call(CurrentAssessment, "getResult")
        ) {
          const result = CurrentAssessment.getResult(paper, researcher, i18n);
          acc[category].push(result);
        } else if (typeof CurrentAssessment === "function") {
          const configKey = yoastAssessmentConfigLookup[key];
          const config = yoastseoDefaultConfig?.[configKey] || {};
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
    Object.entries(results).map(([category, results]) => [
      category,
      results
        .filter((result) => result.text)
        // Map the result for yoast-component's `ContentAnalysis`
        // See https://github.com/Yoast/wordpress-seo/blob/0742e9b6ba4c0d6ae9d65223267a106b92a6a4a1/js/src/components/contentAnalysis/mapResults.js
        .map((result) => ({
          id: result.getIdentifier(),
          score: result.score,
          rating: scoreToRating(result.score),
          text: result.text,
        })),
    ]),
  );

  return mappedResults;
}

export async function prepareContent({ html, contentSelector = "body" } = {}) {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");

  // Remove all script tags
  for (const script of Array.from(
    htmlDocument.body.querySelectorAll("script"),
  )) {
    script.remove();
  }

  // Find the language and culture
  let langCulture = htmlDocument.documentElement.lang ?? langCultureMap.en;
  if (!langCulture.includes("-")) {
    langCulture =
      langCultureMap?.[langCulture.toLowerCase()] ?? langCultureMap.en;
  }

  // Extract the title, description and content
  const title =
    htmlDocument.title ||
    htmlDocument.querySelector("h1")?.innerText ||
    htmlDocument.querySelector("h2")?.innerText ||
    "";
  const description =
    htmlDocument.querySelector('meta[name="description"]')?.content || "";

  const content = htmlDocument.querySelector(contentSelector)?.innerHTML || "";
  const contentDocument = parser.parseFromString(content, "text/html");

  return {
    htmlDocument,
    contentDocument,
    locale: langCulture,
    title,
    description,
    content,
  };
}

/**
 * Interpreters a score and gives it a particular rating.
 *
 * @param {number} score The score to interpreter.
 * @returns {string} The rating, given based on the score.
 * @see {@link https://github.com/Yoast/wordpress-seo/blob/7be56736334fa3630a353a4629aebf1d9b2935cc/packages/yoastseo/src/scoring/interpreters/scoreToRating.js Copied from Yoast SEO}
 */
export function scoreToRating(score) {
  if (score === -1) return "error";
  if (score === 0) return "feedback";
  if (score <= 4) return "bad";
  if (score > 4 && score <= 7) return "ok";
  if (score > 7) return "good";
  return "";
}

function getI18n(Jed, translations) {
  return new Jed({
    domain: "js-text-analysis",
    locale_data: {
      "js-text-analysis": translations || { "": {} },
    },
  });
}
