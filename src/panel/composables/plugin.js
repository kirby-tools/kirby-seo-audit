import { registerPluginAssets } from "kirbyuse";
import { PLUGIN_CONTEXT_API_ROUTE } from "../constants";

let context;
let pendingPromise;

export function usePluginContext() {
  if (context) return Promise.resolve(context);
  if (pendingPromise) return pendingPromise;

  pendingPromise = window.panel.api
    .get(
      PLUGIN_CONTEXT_API_ROUTE,
      undefined,
      undefined,
      // Avoid showing Panel loading indicator
      true,
    )
    .then((response) => {
      registerPluginAssets(response.assets);
      context = response;
      return context;
    })
    // Without this a failing request stays cached as a rejection and no later view recovers without a full reload
    .finally(() => {
      pendingPromise = undefined;
    });

  return pendingPromise;
}

export function invalidatePluginContext() {
  context = undefined;
  pendingPromise = undefined;
}
