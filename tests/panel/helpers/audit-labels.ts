import { createAuditLabels } from "../../../src/panel/utils/audit-labels";

// Renders each key without its plugin prefix, so the markup shows which label lands where.
export const labels = createAuditLabels(
  (key) => key.split(".").slice(2).join("."),
  "en-US",
);
