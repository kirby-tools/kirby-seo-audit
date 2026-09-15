<script setup lang="ts">
import type { LicenseStatus } from "@kirby-tools/licensing";
import type { PropType } from "vue";
import type { ContentVersion, Report } from "../../types";
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { ref, usePanel } from "kirbyuse";
import { usePluginContext } from "../../composables";
import AuditResult from "../Ui/AuditResult.vue";
import ReportMeta from "../Ui/ReportMeta.vue";
import ReportRatings from "../Ui/ReportRatings.vue";

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

const licenseStatus = ref<LicenseStatus>();
const isZeroOneBuild = __ZERO_ONE__;

(async () => {
  const context = await usePluginContext();
  licenseStatus.value =
    __PLAYGROUND__ || __ZERO_ONE__ ? "active" : context.licenseStatus;
})();
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
    <AuditResult :results="results" :links="links" is-dialog>
      <template #header>
        <div
          class="ksr-mb-[var(--spacing-6)] ksr-flex ksr-items-start ksr-justify-between"
        >
          <k-text>
            <h2>
              {{
                results.seo.length > 0 && results.readability.length > 0
                  ? panel.t("johannschopplich.seo-audit.results")
                  : results.seo.length > 0
                    ? panel.t("johannschopplich.seo-audit.results.seo")
                    : panel.t("johannschopplich.seo-audit.results.readability")
              }}
            </h2>
            <ReportRatings
              :ratings="ratings"
              class="ksr-mt-[var(--spacing-3)]"
            />
          </k-text>
          <div v-if="licenseStatus !== undefined && !isZeroOneBuild">
            <LicensingButtonGroup
              label="Kirby SEO Audit"
              api-namespace="__seo-audit__"
              :license-status="licenseStatus"
              pricing-url="https://kirby.tools/seo-audit/buy"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <p
          class="ksr-mt-[var(--spacing-4)] ksr-text-[var(--color-text-dimmed)]"
        >
          <ReportMeta :version="version" :timestamp="timestamp" />
        </p>
      </template>
    </AuditResult>
  </k-dialog>
</template>
