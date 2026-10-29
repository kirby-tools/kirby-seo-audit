import { toIntlLocale, usePanel } from "kirbyuse";
import { computed } from "vue";
import { createAuditLabels } from "../utils/audit-labels";

export function useAuditLabels() {
  const panel = usePanel();

  return computed(() =>
    createAuditLabels(
      (key) => panel.t(key) ?? key,
      toIntlLocale(panel.translation.code),
    ),
  );
}
