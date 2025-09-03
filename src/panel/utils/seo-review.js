import { Readability } from "@mozilla/readability";
import { loadPluginModule, resolvePluginAsset } from "kirbyuse";
import {
  LANGUAGE_TO_LOCALE_MAP,
  YOAST_ASSESSMENTS_LOCALE_COMPATIBILITY_MAP,
  YOAST_IGNORED_ASSESSMENTS,
  YOAST_KEYPHRASE_ASSESSMENTS,
} from "../constants";
import de from "../translations/assessments/de.json";
import en from "../translations/assessments/en.json";
import es from "../translations/assessments/es.json";
import fr from "../translations/assessments/fr.json";
import nl from "../translations/assessments/nl.json";
import { altAttribute, headingStructureOrder, singleH1 } from "./assessments";
import { IncompatibleLocaleError } from "./error";
import { get } from "./safe-get";
import { renderTemplate } from "./template";

const TRANSLATIONS = {
  de,
  en,
  es,
  fr,
  nl,
};

const ASSESSMENTS = {
  seo: {
    altAttribute,
    headingStructureOrder,
    singleH1,
  },
};

export function createSeoReport({
  htmlDocument,
  contentSelector,
  assessments: selectedAssessments,
  language,
}) {
  const translations = TRANSLATIONS[language] ?? TRANSLATIONS.en;
  const results = {};

  for (const [category, assessments] of Object.entries(ASSESSMENTS)) {
    const categoryResults = [];

    for (const [key, assessmentFn] of Object.entries(assessments)) {
      // Skip assessment if it's not part of the selected assessments
      if (
        selectedAssessments.length > 0 &&
        !selectedAssessments.includes(key.toLowerCase())
      ) {
        continue;
      }

      const {
        score,
        translation,
        context = {},
        details,
      } = assessmentFn({
        htmlDocument,
        contentSelector,
      });

      const template = get(translations, `${key}.${translation}`);

      // Ensure translations is available
      if (!template) continue;

      const label = get(translations, `${key}._label`, key);

      // Lowercase all keys in context for the template renderer
      const _context = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [
          key.toLowerCase(),
          value,
        ]),
      );

      categoryResults.push({
        score,
        rating: scoreToRating(score),
        text: `${label}: ${renderTemplate(template, _context)}`,
        details,
      });
    }

    results[category] = categoryResults;
  }

  return results;
}

export async function createYoastSeoReport({
  htmlDocument,
  contentSelector,
  options,
  language,
}) {
  const { Paper, helpers, AnalysisTranslations } =
    await loadPluginModule("yoastseo");

  const paperLocale = options.language.split("-")[0];
  const worker = await loadYoastSeoAnalysisWebWorker(paperLocale);

  await worker.initialize({
    // https://github.com/pimterry/loglevel
    logLevel: import.meta.env.DEV ? "trace" : "info",
    translations: {
      default: AnalysisTranslations[language] ?? {
        domain: "wordpress-seo",
        locale_data: {
          "wordpress-seo": {
            "": {},
          },
        },
      },
    },
  });

  const paperText = extractContent(htmlDocument, contentSelector);

  const paper = new Paper(paperText, {
    keyword: options.keyword,
    synonyms: options.synonyms.join(","),
    slug: new URL(options.url).pathname,
    permalink: options.url,
    title: options.title,
    titleWidth: helpers.measureTextWidth(options.title),
    description: options.description,
    locale: options.language.replace("-", "_"),
  });

  const { result: rawResult } = await worker.analyze(paper);
  const analysisResults = [
    ...rawResult.seo[""].results.map((i) => ({ ...i, _category: "seo" })),
    ...rawResult.readability.results.map((i) => ({
      ...i,
      _category: "readability",
    })),
  ];

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(analysisResults);
  }

  const resultsByCategory = {
    seo: [],
    readability: [],
  };

  for (const result of analysisResults) {
    if (!result.text) continue;

    const id = result._identifier.toLowerCase();

    // Some assessments have been deprecated or are not relevant
    if (YOAST_IGNORED_ASSESSMENTS.some((key) => key.toLowerCase() === id))
      continue;

    // Skip keyphrase assessments if keyword is empty and no assessments are selected
    if (
      !options.keyword &&
      options.assessments.length === 0 &&
      YOAST_KEYPHRASE_ASSESSMENTS.some((key) => key.toLowerCase() === id)
    )
      continue;

    // Process only selected assessments (if any)
    if (
      options.assessments.length > 0 &&
      !options.assessments.some((key) => key.toLowerCase() === id)
    )
      continue;

    // Throw error if one of the selected assessments is not compatible with the document's language
    if (options.assessments.length > 0) {
      const compatibleLocales = Object.entries(
        YOAST_ASSESSMENTS_LOCALE_COMPATIBILITY_MAP,
      ).find(([key]) => key.toLowerCase() === id)?.[1];

      if (compatibleLocales && !compatibleLocales.includes(paperLocale)) {
        throw new IncompatibleLocaleError({
          locale: paperLocale,
          assessment: result._identifier,
          compatibleLocales,
        });
      }
    }

    resultsByCategory[result._category].push({
      ...result,
      rating: scoreToRating(result.score),
    });
  }

  return resultsByCategory;
}

let analysisWorkerWrapper;

/**
 * Loads the web worker for Yoast SEO analysis.
 */
async function loadYoastSeoAnalysisWebWorker(language) {
  if (analysisWorkerWrapper) return analysisWorkerWrapper;

  const { url: workerSrc } = resolvePluginAsset("worker.js");
  const { AnalysisWorkerWrapper } = await loadPluginModule("yoastseo");

  const workerUnwrapped = new Worker(workerSrc);
  workerUnwrapped.postMessage({ language });

  analysisWorkerWrapper = new AnalysisWorkerWrapper(workerUnwrapped);
  return analysisWorkerWrapper;
}

/**
 * Interpreters a score and gives it a particular rating.
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

  // Extract main article
  const article = new Readability(htmlDocument).parse();

  // Find the language
  let language = htmlDocument.documentElement.lang || LANGUAGE_TO_LOCALE_MAP.en;
  if (!language.includes("-")) {
    language =
      LANGUAGE_TO_LOCALE_MAP[language.toLowerCase()] ||
      LANGUAGE_TO_LOCALE_MAP.en;
  }

  // Extract the title and description
  const title =
    htmlDocument.title ||
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
    htmlDocument.querySelector("h1")?.innerText ||
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
    htmlDocument.querySelector("h2")?.innerText ||
    "";
  const description =
    htmlDocument.querySelector('meta[name="description"]')?.content || "";

  return {
    htmlDocument,
    article,
    language,
    title,
    description,
  };
}

/**
 * Extracts the content from the given HTML document using the provided content selector.
 */
export function extractContent(htmlDocument, contentSelector) {
  const elements = htmlDocument.querySelectorAll(contentSelector);
  return Array.from(elements)
    .map((element) => element.innerHTML)
    .join("\n");
}
