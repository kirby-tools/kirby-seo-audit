import { useContent, usePanel } from "kirbyuse";
import {
  extractContent,
  performSeoReview,
  performYoastSeoReview,
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
      // Trim trailing `assessment` suffix if present
      if (assessment.endsWith("assessment"))
        assessment = assessment.slice(0, -10);
      return assessment;
    });

    // eslint-disable-next-line no-undef
    const language = __PLAYGROUND__
      ? currentContent.value.language
      : panel.translation.code;

    const kirbySeoResult = performSeoReview({
      htmlDocument,
      contentSelector,
      assessments: options.assessments,
      language,
    });

    const yoastSeoResult = await performYoastSeoReview({
      htmlDocument,
      contentSelector,
      options,
      language,
    });

    const result = {
      seo: [],
      readability: [],
    };

    for (const [category, assessments] of Object.entries({
      ...kirbySeoResult,
      ...yoastSeoResult,
    })) {
      result[category] = result[category].concat(assessments);
    }

    return result;
  };

  return {
    generateReport,
  };
}
