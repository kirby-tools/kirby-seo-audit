import type { Report } from "../types";
import { onBeforeUnmount, usePanel } from "kirbyuse";
import { resolveAuto } from "../utils/auto";
import { useLogger } from "./logger";
import { usePluginContext } from "./plugin";

// One run per view and language: the first component to react runs it, and
// the others on the same view adopt its report through the shared rating.
const inFlightRuns = new Map<string, Promise<Report>>();

/**
 * Runs the analysis on its own once the editor publishes, if `auto` asks for
 * it. The run is silent.
 */
export function useAutoAnalysis({
  auto,
  run,
}: {
  auto: () => unknown;
  run: (language: string) => Promise<Report>;
}) {
  const panel = usePanel();
  const logger = useLogger();

  async function onPublish({ language }: { language: string }) {
    try {
      const { config } = await usePluginContext();

      if (resolveAuto(auto(), config.auto) !== "publish") return;

      const key = `${panel.view.path}:${language ?? ""}`;
      if (inFlightRuns.has(key)) return;

      const pendingRun = run(language).finally(() => inFlightRuns.delete(key));
      inFlightRuns.set(key, pendingRun);
      await pendingRun;
    } catch (error) {
      logger.error(error);
    }
  }

  // Subscribed synchronously: an unmount before an async setup resolves
  // would call `off` first, which the event bus silently ignores.
  panel.events.on("content.publish", onPublish);

  onBeforeUnmount(() => {
    panel.events.off("content.publish", onPublish);
  });
}
