import { useContent, usePanel } from "kirbyuse";
import {
  createSeoReport,
  createYoastSeoReport,
  prepareContent,
} from "../utils/seo-review";
import { useLogger } from "./logger";

export function useSeoReview() {
  const panel = usePanel();
  const { currentContent } = useContent();
  const logger = useLogger();

  async function generateReport(url, contentSelector, options) {
    logger.info("Starting SEO analysis for", url);

    if (import.meta.env.DEV) {
      options.logLevel = 3;
    }

    const html = await fetchHtml(url);
    const { htmlDocument, language, title, description } =
      await prepareContent(html);

    // Resolve assessment names
    options.assessments = options.assessments.map((i) => {
      let assessment = i.toLowerCase();
      // Trim trailing `assessment` suffix if present
      if (assessment.endsWith("assessment"))
        assessment = assessment.slice(0, -10);
      return assessment;
    });

    // eslint-disable-next-line no-undef
    const panelLanguage = __PLAYGROUND__
      ? currentContent.value.language
      : panel.translation.code;

    const kirbySeoResult = createSeoReport({
      htmlDocument,
      contentSelector,
      assessments: options.assessments,
      language: panelLanguage,
      logger,
    });

    const yoastSeoResult = await createYoastSeoReport({
      htmlDocument,
      contentSelector,
      options: {
        ...options,
        url,
        title,
        description,
        language,
      },
      language: panelLanguage,
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
