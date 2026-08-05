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
    // Same-origin pages raise no CORS question, so the browser reads them itself.
    if (location.origin === new URL(url).origin) {
      const response = await fetch(url);
      if (!response.ok) {
        logger.warn(
          `Response status code ${response.status} for ${url} indicates the page contains an error`,
        );
      }
      return await response.text();
    }

    // The proxy derives the URL from the model, so it takes the Panel path. Only
    // the playground analyzes a URL with no model behind it, and its own install
    // opts into that with `proxy.allowArbitraryUrls`.
    const { code, html } = await panel.api.post(
      PLUGIN_PROXY_API_ROUTE,
      path ? { path } : { url },
    );

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
