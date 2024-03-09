/* eslint-disable unicorn/prefer-dom-node-text-content */
import yoastseoDefaultConfig from "yoastseo/src/config/content/default.js";
import {
  ASSESSMENT_CONFIG_LOOKUP,
  IGNORED_ASSESSMENTS,
  KEYPHRASE_ASSESSMENTS,
  LANG_CULTURES,
} from "../constants";
import de from "../translations/assessments/de.json";
import en from "../translations/assessments/en.json";
import { getModule, interopDefault } from "./assets";
import { get } from "./safe-get";
import { renderTemplate } from "./template";
import { altAttribute, headingStructureOrder, singleH1 } from "./assessments";

const TRANSLATIONS = {
  de,
  en,
};

const ASSESSMENTS = {
  seo: [altAttribute, headingStructureOrder, singleH1],
  readability: [],
};

export function performSeoReview({
  htmlDocument,
  contentSelector,
  assessments: selectedAssessments,
  locale,
}) {
  const translations = TRANSLATIONS[locale] || TRANSLATIONS.en;

  return Object.fromEntries(
    Object.entries(ASSESSMENTS).map(([category, assessments]) => [
      category,
      assessments
        .filter(
          (assessmentFn) =>
            selectedAssessments.length === 0 ||
            selectedAssessments.includes(assessmentFn.name.toLowerCase()),
        )
        .map((assessmentFn) => {
          const { score, translation, context } = assessmentFn({
            htmlDocument,
            contentSelector,
          });

          return {
            score,
            rating: scoreToRating(score),
            text: renderTemplate(
              get(translations, `${assessmentFn.name}.${translation}`, context),
            ),
          };
        }),
    ]),
  );
}

export async function performYoastSeoReview({
  htmlDocument,
  contentSelector,
  options,
  translations,
}) {
  const YoastSEO = await getModule("yoastseo");
  const { Jed } = await getModule("jed");
  const pixelWidth = await interopDefault(getModule("string-pixel-width"));

  const content = htmlDocument.querySelector(contentSelector)?.innerHTML || "";

  const paper = new YoastSEO.Paper(content, {
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
  const i18n = new Jed({
    domain: "js-text-analysis",
    locale_data: {
      "js-text-analysis": translations || { "": {} },
    },
  });

  const results = Object.entries(YoastSEO.assessments).reduce(
    (resultsByCategory, [category, assessments]) => {
      for (const [key, CurrentAssessment] of Object.entries(assessments)) {
        // Some assessments have been deprecated or are not relevant
        if (IGNORED_ASSESSMENTS.includes(key)) continue;

        // Skip keyphrase assessments if keyword is empty
        if (
          !options.keyword &&
          options.assessments.length === 0 &&
          KEYPHRASE_ASSESSMENTS.includes(key)
        )
          continue;

        // User-defined list of assessments
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
          resultsByCategory[category].push(result);
        } else if (typeof CurrentAssessment === "function") {
          const configKey = ASSESSMENT_CONFIG_LOOKUP[key];
          const config = yoastseoDefaultConfig?.[configKey] || {};
          const result = new CurrentAssessment(config).getResult(
            paper,
            researcher,
            i18n,
          );
          resultsByCategory[category].push(result);
        }
      }

      return resultsByCategory;
    },
    {
      seo: [],
      readability: [],
    },
  );

  for (const category of Object.keys(results)) {
    results[category] = results[category]
      .filter((result) => result.text)
      // Map the result for yoast-component's `ContentAnalysis`
      // See https://github.com/Yoast/wordpress-seo/blob/0742e9b6ba4c0d6ae9d65223267a106b92a6a4a1/js/src/components/contentAnalysis/mapResults.js
      .map((result) => ({
        // id: result.getIdentifier(),
        score: result.score,
        rating: scoreToRating(result.score),
        text: result.text,
      }));
  }

  return results;
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
  if (score <= 7) return "ok";
  if (score > 7) return "good";
  return "";
}

/**
 * Processes a given HTML string for content analysis.
 */
export async function prepareContent(html) {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");

  // Remove all script and style tags
  for (const tag of Array.from(
    htmlDocument.body.querySelectorAll("script, style"),
  )) {
    tag.remove();
  }

  // Find the language and culture
  let locale = htmlDocument.documentElement.lang ?? LANG_CULTURES.en;
  if (!locale.includes("-")) {
    locale = LANG_CULTURES?.[locale.toLowerCase()] ?? LANG_CULTURES.en;
  }

  // Extract the title, description and content
  const title =
    htmlDocument.title ||
    htmlDocument.querySelector("h1")?.innerText ||
    htmlDocument.querySelector("h2")?.innerText ||
    "";
  const description =
    htmlDocument.querySelector('meta[name="description"]')?.content || "";

  return {
    htmlDocument,
    locale,
    title,
    description,
  };
}