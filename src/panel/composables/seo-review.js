import { computed, usePanel, useStore } from "kirbyuse";
import { getModule, interopDefault } from "../utils/assets";
import { performSeoReview, performYoastSeoReview } from "../utils/seo-review";

export function useSeoReview() {
  const panel = usePanel();
  const store = useStore();
  const currentContent = computed(() => store.getters["content/values"]());

  const generateReport = async (htmlDocument, contentSelector, options) => {
    const YoastSEOTranslations = await interopDefault(
      getModule("yoastseo-translations"),
    );

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

    const result = performSeoReview({
      htmlDocument,
      contentSelector,
      assessments: options.assessments,
      locale,
    });

    const yoastResult = await performYoastSeoReview({
      htmlDocument,
      contentSelector,
      options,
      translations: YoastSEOTranslations[locale],
    });

    result.seo = result.seo.concat(yoastResult.seo);
    result.readability = result.readability.concat(yoastResult.readability);

    return result;
  };

  return {
    generateReport,
  };
}
