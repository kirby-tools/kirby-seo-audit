import { useContent, usePanel } from "kirbyuse";
import { createSeoReport, createYoastSeoReport } from "../utils/seo-review";
import { useLogger } from "./logger";

export function useSeoReview() {
  const panel = usePanel();
  const { currentContent } = useContent();
  const logger = useLogger();

  async function generateReport(htmlDocument, contentSelector, options) {
    if (import.meta.env.DEV) {
      options.logLevel = 3;
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

    const kirbySeoResult = createSeoReport({
      htmlDocument,
      contentSelector,
      assessments: options.assessments,
      language,
      logger,
    });

    const yoastSeoResult = await createYoastSeoReport({
      htmlDocument,
      contentSelector,
      options,
      language,
      logger,
    });

    const resultsByCategory = {
      seo: [...(kirbySeoResult.seo ?? []), ...(yoastSeoResult.seo ?? [])],
      readability: [
        ...(kirbySeoResult.readability ?? []),
        ...(yoastSeoResult.readability ?? []),
      ],
    };

    return resultsByCategory;
  }

  async function fetchHtml(url) {
    // Check if the current location has the same origin as the target URL
    if (location.origin === new URL(url).origin) {
      const response = await fetch(url);
      if (!response.ok) {
        logger.warn(
          `Response status code ${response.status} for ${url} indicates the page contains an error`,
        );
      }
      return await response.text();
    }

    const { code, html } = await panel.api.post("__seo-audit__/proxy", {
      url,
    });

    if (code !== 200) {
      logger.warn(
        `Response status code ${code} for ${url} indicates the page contains an error`,
      );
    }

    return html;
  }

  return {
    generateReport,
    fetchHtml,
  };
}
