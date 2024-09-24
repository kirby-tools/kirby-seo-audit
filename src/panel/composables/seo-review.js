import { computed, usePanel, useStore } from "kirbyuse";
import { getModule, interopDefault } from "../utils/assets";
import { performSeoReview, performYoastSeoReview } from "../utils/seo-review";
import { useLogger } from "./logger";

export function useSeoReview() {
  const panel = usePanel();
  const store = useStore();
  const currentContent = computed(() => store.getters["content/values"]());
  const logger = useLogger();

  const generateReport = async (htmlDocument, contentSelector, options) => {
    if (import.meta.env.DEV) {
      options.logLevel = 3;
    }

    const YoastSEOTranslations = await interopDefault(
      getModule("yoastseo-translations"),
    );

    if (options.logLevel > 1) {
      if (contentSelector) {
        logger.info("Content selector:", contentSelector);
      }

      const elements = htmlDocument.querySelectorAll(contentSelector);
      const content = Array.from(elements)
        .map((element) => element.innerHTML)
        .join("\n");
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
