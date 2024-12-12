import { loadPluginModule, useContent, usePanel } from "kirbyuse";
import { interopDefault } from "../utils/assets";
import { IncompatibleLocaleError } from "../utils/error";
import {
  extractContent,
  performSeoReview,
  performYoastSeoReview,
  validateYoastSeoLocaleCompatibility,
} from "../utils/seo-review";
import { useLogger } from "./logger";

export function useSeoReview() {
  const panel = usePanel();
  const { currentContent } = useContent();
  const logger = useLogger();

  const generateReport = async (htmlDocument, contentSelector, options) => {
    if (import.meta.env.DEV) {
      options.logLevel = 3;
    }

    const YoastSEOTranslations = await interopDefault(
      loadPluginModule("yoastseo-translations"),
    );

    if (options.logLevel > 1) {
      if (contentSelector) {
        logger.info("Content selector:", contentSelector);
      }

      const elements = htmlDocument.querySelectorAll(contentSelector);
      const content = extractContent(htmlDocument, contentSelector);
      logger.info("Selected elements:", elements);
      logger.info("Selected content:", content);
    }

    // Resolve assessment names
    options.assessments = options.assessments.map((i) => {
      let assessment = i.toLowerCase();
      if (!assessment.endsWith("assessment")) assessment += "assessment";
      return assessment;
    });

    // eslint-disable-next-line no-undef
    const locale = __PLAYGROUND__
      ? currentContent.value.language
      : panel.translation.code;

    const result = {
      seo: [],
      readability: [],
    };

    const seoResult = performSeoReview({
      htmlDocument,
      contentSelector,
      assessments: options.assessments,
      locale,
    });

    for (const [category, assessments] of Object.entries(seoResult)) {
      result[category] = result[category].concat(assessments);
    }

    // Validate if the current locale is supported by the given Yoast SEO assessments
    const localeCompatibilityResult = await validateYoastSeoLocaleCompatibility(
      locale,
      options,
    );
    if (localeCompatibilityResult) {
      throw new IncompatibleLocaleError({
        ...localeCompatibilityResult,
        locale,
      });
    }

    const yoastResult = await performYoastSeoReview({
      htmlDocument,
      contentSelector,
      options,
      translations: YoastSEOTranslations[locale],
    });

    for (const [category, assessments] of Object.entries(yoastResult)) {
      result[category] = result[category].concat(assessments);
    }

    return result;
  };

  return {
    generateReport,
  };
}
