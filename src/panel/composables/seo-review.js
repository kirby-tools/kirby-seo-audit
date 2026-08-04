import { useContent, usePanel } from "kirbyuse";
import { PLUGIN_PROXY_API_ROUTE } from "../constants";
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

  async function generateReport(target, contentSelector, options) {
    logger.info("Starting SEO analysis for", target.url);

    if (import.meta.env.DEV) {
      options.logLevel = 3;
    }

    const html = await fetchHtml(target);
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
        url: target.url,
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

  async function fetchHtml({ url, path }) {
    const isSameOrigin = location.origin === new URL(url).origin;

    // The playground analyzes arbitrary URLs, which the proxy deliberately no
    // longer accepts, so it reads them directly and lives with CORS
    if (isSameOrigin || __PLAYGROUND__) {
      const response = await fetch(url);
      if (!response.ok) {
        logger.warn(
          `Response status code ${response.status} for ${url} indicates the page contains an error`,
        );
      }
      return await response.text();
    }

    // The proxy derives the URL server-side; the browser cannot choose the target
    const { code, html } = await panel.api.post(PLUGIN_PROXY_API_ROUTE, {
      path,
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
