import type {
  AnalysisOptions,
  ContentVersion,
  PreviewTarget,
  PreviewUrlResponse,
  ProxyResponse,
  Report,
} from "../types";
import { isKirby5, useContent, usePanel } from "kirbyuse";
import {
  PLUGIN_PREVIEW_URL_API_ROUTE,
  PLUGIN_PROXY_API_ROUTE,
} from "../constants";
import {
  IncompatibleLocaleError,
  MissingPreviewUrlError,
  PreviewResponseError,
  PreviewUnreachableError,
} from "../utils/error";
import { createLanguageRequestOptions } from "../utils/request";
import {
  createSeoReport,
  createYoastSeoReport,
  prepareContent,
} from "../utils/seo-review";
import { rateReport } from "../utils/seo-score";
import { useLogger } from "./logger";

export function useSeoReview() {
  const panel = usePanel();
  const logger = useLogger();
  const { currentContent } = useContent();

  async function runAnalysis(
    language: string,
    contentSelector: string,
    options: AnalysisOptions,
  ): Promise<Report> {
    const target: PreviewTarget = __PLAYGROUND__
      ? { url: currentContent.value.targeturl }
      : await resolvePreviewTarget(language, await resolveContentVersion());
    const { results, ratings } = await generateReport(
      target,
      contentSelector,
      options,
    );

    return {
      results,
      ratings,
      version: target.version,
      timestamp: Date.now(),
    };
  }

  function notifyReportError(error: unknown) {
    logger.error(error);

    if (error instanceof PreviewResponseError) {
      panel.notification.error(
        panel.t(
          // Only the proxy can send credentials the editor's browser lacks.
          error.status === 401 && error.isProxied
            ? "johannschopplich.seo-audit.error.previewUnauthorized"
            : "johannschopplich.seo-audit.error.previewResponse",
          { url: error.url, status: error.status },
        ),
      );
      return;
    }

    if (error instanceof PreviewUnreachableError) {
      panel.notification.error(
        panel.t("johannschopplich.seo-audit.error.previewUnreachable", {
          url: error.url,
        }),
      );
      return;
    }

    if (error instanceof MissingPreviewUrlError) {
      panel.notification.error(
        panel.t("johannschopplich.seo-audit.error.missingPreviewUrl"),
      );
      return;
    }

    if (error instanceof IncompatibleLocaleError) {
      panel.notification.error(
        panel.t("johannschopplich.seo-audit.error.incompatibleLocale", {
          locale: error.locale.toUpperCase(),
          assessment: error.assessment,
          compatibleLocales: error.compatibleLocales
            .map((i) => i.toUpperCase())
            .join(", "),
        }),
      );
      return;
    }

    panel.notification.error(
      panel.t("johannschopplich.seo-audit.notification.analyzeError"),
    );
  }

  return {
    runAnalysis,
    notifyReportError,
  };
}

async function resolvePreviewTarget(
  language: string,
  version: ContentVersion,
): Promise<PreviewTarget> {
  const panel = usePanel();
  const { url, version: resolvedVersion } =
    await panel.api.get<PreviewUrlResponse>(
      PLUGIN_PREVIEW_URL_API_ROUTE,
      { path: panel.view.path, version },
      createLanguageRequestOptions(language),
      true,
    );

  if (!url) {
    throw new MissingPreviewUrlError({ path: panel.view.path });
  }

  return {
    url,
    path: panel.view.path,
    language,
    version: resolvedVersion,
  };
}

/**
 * Names the content version to analyze: `changes` once the form differs
 * from the published content. Pending changes are flushed first, so the
 * server renders what the form shows; an editor who cannot flush analyzes
 * them all the same.
 */
async function resolveContentVersion(): Promise<ContentVersion> {
  const { content, hasChanges, isEditable } = useContent();

  if (!isKirby5() || !hasChanges.value) {
    return "latest";
  }

  if (isEditable.value) {
    await content.save(content.version("changes"));
  }

  return "changes";
}

async function generateReport(
  target: PreviewTarget,
  contentSelector: string,
  options: AnalysisOptions,
): Promise<Pick<Report, "results" | "ratings">> {
  const logger = useLogger();
  logger.info("Starting SEO analysis for", target.url);

  if (import.meta.env.DEV) {
    options.logLevel = 3;
  }

  const html = await fetchHtml(target);
  const { htmlDocument, language, title, description } =
    await prepareContent(html);

  options.assessments = options.assessments.map((i) => {
    let assessment = i.toLowerCase();
    // Trim trailing `assessment` suffix if present.
    if (assessment.endsWith("assessment"))
      assessment = assessment.slice(0, -10);
    return assessment;
  });

  const panelLanguage = __PLAYGROUND__
    ? useContent().currentContent.value.language
    : usePanel().translation.code;

  const kirbySeoResult = createSeoReport({
    htmlDocument,
    contentSelector,
    assessments: options.assessments,
    language: panelLanguage,
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

  const results = {
    seo: [...(kirbySeoResult.seo ?? []), ...(yoastSeoResult.seo ?? [])],
    readability: [
      ...(kirbySeoResult.readability ?? []),
      ...(yoastSeoResult.readability ?? []),
    ],
  };

  return {
    results,
    ratings: rateReport(results, language.split("-")[0]!),
  };
}

async function fetchHtml({ url, path, language, version }: PreviewTarget) {
  // Same-origin pages raise no CORS question, so the browser reads them itself.
  if (location.origin === new URL(url).origin) {
    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new PreviewUnreachableError({ url });
    }
    if (!response.ok) {
      throw new PreviewResponseError({ url, status: response.status });
    }
    return await response.text();
  }

  // The proxy derives the URL from the model, so it takes the Panel path. Only
  // the playground analyzes a URL with no model behind it, and its own install
  // opts into that with `proxy.allowArbitraryUrls`.
  const {
    code,
    html,
    url: fetchedUrl,
  } = await usePanel().api.post<ProxyResponse>(
    PLUGIN_PROXY_API_ROUTE,
    path ? { path, version } : { url },
    createLanguageRequestOptions(language),
    "POST",
    true,
  );

  if (code === null) {
    throw new PreviewUnreachableError({ url: fetchedUrl });
  }

  if (!(code >= 200 && code < 300)) {
    throw new PreviewResponseError({
      url: fetchedUrl,
      status: code,
      isProxied: true,
    });
  }

  return html!;
}
