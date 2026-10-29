import { usePanel } from "kirbyuse";
import { computed } from "vue";
import { createAuditLabels } from "../utils/audit-labels";

export function useAuditLabels() {
  const panel = usePanel();

  return computed(() =>
    createAuditLabels(
      (key) => panel.t(key) ?? key,
      // Kirby's `sr@latin` is not a BCP 47 tag.
      panel.translation.code.replace("_", "-").replace("@latin", "-Latn"),
    ),
  );
}
