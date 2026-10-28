<script setup lang="ts">
import type { LicenseStatus } from "@kirby-tools/licensing";
import type { PropType } from "vue";
import type { ContentVersion, Report } from "../../types";
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { usePanel } from "kirbyuse";
import { onBeforeUnmount, ref } from "vue";
import { useAuditLabels, usePluginContext } from "../../composables";
import { LICENSE_ACTIVATE_EVENT } from "../../constants";
import ReportBody from "../Ui/ReportBody.vue";

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

const panel = usePanel();
const labels = useAuditLabels();
const hasLicenseButtons = !__PLAYGROUND__ && !__ZERO_ONE__;

const licenseStatus = ref<LicenseStatus>();
const licenseDialog = ref<string>();

if (hasLicenseButtons) {
  usePluginContext().then((context) => {
    licenseStatus.value = context.licenseStatus;
    licenseDialog.value = context.licenseDialog;
  });

  // Kirby reopens this dialog from its history after the activation dialog,
  // with the status it had before.
  const onActivate = () => {
    licenseStatus.value = "active";
  };
  panel.events.on(LICENSE_ACTIVATE_EVENT, onActivate);
  onBeforeUnmount(() => {
    panel.events.off(LICENSE_ACTIVATE_EVENT, onActivate);
  });
}
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
    <ReportBody
      :results="results"
      :ratings="ratings"
      :version="version"
      :timestamp="timestamp"
      :links="links"
      :labels="labels"
    >
      <template v-if="licenseStatus && licenseDialog" #options>
        <LicensingButtonGroup
          :dialog="licenseDialog"
          :license-status="licenseStatus"
          pricing-url="https://kirby.tools/seo-audit/buy"
        />
      </template>
    </ReportBody>
  </k-dialog>
</template>
