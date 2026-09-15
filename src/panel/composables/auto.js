import { onBeforeUnmount, usePanel } from "kirbyuse";
import { resolveAuto } from "../utils/auto";
import { useLogger } from "./logger";
import { usePluginContext } from "./plugin";

// One run per view and language: the first component to react runs it, the
// others on the same view wait for that run and adopt its result.
const inFlightRuns = new Map();

/**
 * Runs the analysis on its own once the editor publishes, if `auto` asks for
 * it. The run is silent; `onResult` lets a component show the outcome its
 * own way.
 */
export function useAutoAnalysis({ auto, run, onResult }) {
  const panel = usePanel();
  const logger = useLogger();

  async function onPublish({ language }) {
    try {
      const { config } = await usePluginContext();

      if (resolveAuto(auto(), config.auto) !== "publish") return;

      const key = `${panel.view.path}:${language ?? ""}`;
      let pendingRun = inFlightRuns.get(key);

      if (!pendingRun) {
        pendingRun = run(language).finally(() => inFlightRuns.delete(key));
        inFlightRuns.set(key, pendingRun);
      }

      onResult?.(await pendingRun, language);
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
