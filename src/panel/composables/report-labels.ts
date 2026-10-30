import { toIntlLocale, usePanel } from "kirbyuse";
import { computed } from "vue";
import { createReportLabels } from "../utils/report-labels";

export function useReportLabels() {
  const panel = usePanel();

  return computed(() =>
    createReportLabels(
      (key) => panel.t(key) ?? key,
      toIntlLocale(panel.translation.code),
    ),
  );
}
