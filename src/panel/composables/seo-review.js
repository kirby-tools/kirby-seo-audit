import { computed, usePanel, useStore } from "kirbyuse";
import { getModule, interopDefault } from "../utils/assets";
import { performYoastSeoReview } from "../utils/seo-review";

export function useSeoReview() {
  const panel = usePanel();
  const store = useStore();
  const currentContent = computed(() => store.getters["content/values"]());

  const performSeoReview = async (html, options) => {
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
    const translations = __PLAYGROUND__
      ? YoastSEOTranslations[currentContent.value.language]
      : YoastSEOTranslations[panel.translation.code];

    return await performYoastSeoReview({ html, options, translations });
  };

  return {
    performSeoReview,
  };
}
