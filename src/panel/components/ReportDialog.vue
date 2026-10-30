<script setup lang="ts">
import type { PropType } from "vue";
import type { ContentVersion, Report } from "../types";
import { useLicenseStatus } from "@kirby-tools/licensing";
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { usePluginContext, useReportLabels } from "../composables";
import ReportDialogBody from "./Ui/ReportDialogBody.vue";

defineProps({
  results: {
    type: Object as PropType<Report["results"]>,
    required: true,
  },
  ratings: {
    type: Object as PropType<Report["ratings"]>,
    required: true,
  },
  version: String as PropType<ContentVersion>,
  timestamp: {
    type: Number,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  (event: "cancel"): void;
  (event: "close"): void;
  (event: "input", value: unknown): void;
  (event: "submit"): void;
  (event: "success"): void;
}>();

const labels = useReportLabels();
const hasLicenseButtons = !__PLAYGROUND__ && !__ZERO_ONE__;

const { licenseStatus, licenseDialog } = useLicenseStatus({
  pluginId: "seo-audit",
  resolveContext: usePluginContext,
});
</script>

<template>
  <k-dialog
    :cancel-button="false"
    :submit-button="false"
    :visible="true"
    size="large"
    class="k-seo-audit-report-dialog"
    @cancel="emit('cancel')"
  >
    <ReportDialogBody
      :results="results"
      :ratings="ratings"
      :version="version"
      :timestamp="timestamp"
      :links="links"
      :labels="labels"
    >
      <template
        v-if="hasLicenseButtons && licenseStatus && licenseDialog"
        #options
      >
        <LicensingButtonGroup
          :dialog="licenseDialog"
          :license-status="licenseStatus"
          pricing-url="https://kirby.tools/seo-audit/buy"
        />
      </template>
    </ReportDialogBody>
  </k-dialog>
</template>
