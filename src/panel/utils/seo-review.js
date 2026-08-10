import { loadPluginModule, resolvePluginAsset } from "kirbyuse";
import { LOG_LEVELS } from "../constants";
import de from "../translations/assessments/de.json";
import en from "../translations/assessments/en.json";
import es from "../translations/assessments/es.json";
import fr from "../translations/assessments/fr.json";
import nl from "../translations/assessments/nl.json";
import { altAttribute, headingStructureOrder, singleH1 } from "./assessments";
import { resolveDocumentLocale } from "./locale";
import { get } from "./safe-get";
import {
  filterYoastSeoResults,
  flattenYoastSeoResults,
  scoreToRating,
} from "./seo-filter";
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
      // Skip assessment if it's not part of the selected assessments.
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

      if (!template) continue;

      const label = get(translations, `${key}._label`, key);

      // Lowercase all keys in context for the template renderer.
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
  logger,
}) {
  const { Paper, helpers, AnalysisTranslations } =
    await loadPluginModule("yoastseo");

  const paperLocale = options.language.split("-")[0];
  const worker = await loadYoastSeoAnalysisWebWorker(paperLocale);

  await worker.initialize({
    // https://github.com/pimterry/loglevel
    logLevel: import.meta.env.DEV
      ? "trace"
      : (LOG_LEVELS[options.logLevel] ?? "info"),
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

  if (options.logLevel > 1) {
    if (contentSelector) {
      logger?.info("Content selector:", contentSelector);
    }

    const elements = htmlDocument.querySelectorAll(contentSelector);
    logger?.info("Elements by content selector:", elements);
    logger?.info("Analyzing content:", paperText);
  }

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
  const analysisResults = flattenYoastSeoResults(rawResult);

  if (options.logLevel > 1) {
    logger?.info("Yoast SEO analysis results:", analysisResults);
  }

  return filterYoastSeoResults(analysisResults, options, paperLocale);
}

let analysisWorker;

/**
 * Creates the analysis worker, cached per language – the worker picks its
 * researcher from the language it is handed at construction.
 */
async function loadYoastSeoAnalysisWebWorker(language) {
  if (analysisWorker?.language === language) {
    return analysisWorker.wrapper;
  }

  analysisWorker?.worker.terminate();

  const { url: workerSrc } = resolvePluginAsset("worker.js");
  const { AnalysisWorkerWrapper } = await loadPluginModule("yoastseo");

  const worker = new Worker(workerSrc);
  worker.postMessage({ language });

  analysisWorker = {
    language,
    worker,
    wrapper: new AnalysisWorkerWrapper(worker),
  };

  return analysisWorker.wrapper;
}

export async function prepareContent(html) {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");

  for (const tag of [...htmlDocument.body.querySelectorAll("script, style")]) {
    tag.remove();
  }

  const language = resolveDocumentLocale(htmlDocument.documentElement.lang);

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
    language,
    title,
    description,
  };
}

export function extractContent(htmlDocument, contentSelector) {
  const elements = htmlDocument.querySelectorAll(contentSelector);
  return Array.from(elements, (element) => element.innerHTML).join("\n");
}
