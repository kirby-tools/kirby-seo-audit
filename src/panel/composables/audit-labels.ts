import { usePanel } from "kirbyuse";
import { computed } from "vue";
import { createAuditLabels } from "../utils/audit-labels";

export function useAuditLabels() {
  const panel = usePanel();

  return computed(() =>
    createAuditLabels(
      (key) => panel.t(key) ?? key,
      // Kirby sets it to a BCP 47 tag of the Panel language, like `sr` for `sr@latin`.
      document.documentElement.lang,
    ),
  );
}
