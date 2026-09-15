import type { LogLevel } from "../constants";
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
  DEFAULT_LOG_LEVEL,
  LOG_LEVELS,
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
import { usePluginContext } from "./plugin";

export function useSeoReview() {
  const panel = usePanel();
  const { content, currentContent, hasChanges, isEditable } = useContent();
  const logger = useLogger();

  async function generateReport(
    target: PreviewTarget,
    contentSelector: string,
    options: AnalysisOptions,
  ): Promise<Pick<Report, "results" | "ratings">> {
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
      ? currentContent.value.language
      : panel.translation.code;

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
    } = await panel.api.post<ProxyResponse>(
      PLUGIN_PROXY_API_ROUTE,
      path ? { path, version } : { url },
      createLanguageRequestOptions(language),
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

  /**
   * Names the content version to analyze: `changes` once the form differs
   * from the published content. Pending changes are flushed first, so the
   * server renders what the form shows; an editor who cannot flush analyzes
   * them all the same.
   */
  async function resolveContentVersion(): Promise<ContentVersion> {
    if (!isKirby5() || !hasChanges.value) {
      return "latest";
    }

    if (isEditable.value) {
      await content.save(content.version("changes"));
    }

    return "changes";
  }

  /**
   * @throws {MissingPreviewUrlError} When the model has no preview URL for the current user
   */
  async function resolvePreviewTarget(
    language: string,
    version: ContentVersion = "latest",
  ): Promise<PreviewTarget> {
    const { url, version: resolvedVersion } =
      await panel.api.get<PreviewUrlResponse>(
        PLUGIN_PREVIEW_URL_API_ROUTE,
        { path: panel.view.path, version },
        createLanguageRequestOptions(language),
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

  async function resolveLogLevelIndex(logLevel?: LogLevel | null) {
    const context = await usePluginContext();

    return LOG_LEVELS.indexOf(
      logLevel && LOG_LEVELS.includes(logLevel)
        ? logLevel
        : (context.config.logLevel ?? DEFAULT_LOG_LEVEL),
    );
  }

  function resolveKeyphrase(
    keyphrase?: string | null,
    keyphraseField?: string | null,
    content = currentContent.value,
  ): string {
    return (
      keyphrase ||
      (keyphraseField ? content[keyphraseField.toLowerCase()] : undefined) ||
      ""
    );
  }

  function resolveSynonyms(
    synonyms?: string | string[] | null,
    synonymsField?: string | null,
    content = currentContent.value,
  ): string[] {
    if (!synonyms && !synonymsField) return [];

    const value =
      synonyms ||
      (synonymsField ? content[synonymsField.toLowerCase()] : undefined);

    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(",").map((i) => i.trim());

    return [];
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
    generateReport,
    fetchHtml,
    resolveContentVersion,
    resolvePreviewTarget,
    resolveLogLevelIndex,
    resolveKeyphrase,
    resolveSynonyms,
    notifyReportError,
  };
}
