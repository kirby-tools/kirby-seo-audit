<script setup>
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { ref, usePanel } from "kirbyuse";
import { usePluginContext } from "../../composables";
import AuditResult from "../Ui/AuditResult.vue";

defineProps({
  report: {
    type: Object,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["cancel", "close", "input", "submit", "success"]);

const panel = usePanel();

const licenseStatus = ref();

(async () => {
  const context = await usePluginContext();
  licenseStatus.value =
    // eslint-disable-next-line no-undef
    __PLAYGROUND__ ? "active" : context.licenseStatus;
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
    <AuditResult :report="report" :links="links" is-dialog>
      <template #header>
        <div class="ksr-mb-4 ksr-flex ksr-items-center ksr-justify-between">
          <k-text>
            <h2>
              {{
                report.seo.length > 0 && report.readability.length > 0
                  ? panel.t("johannschopplich.seo-audit.results")
                  : report.seo.length > 0
                    ? panel.t("johannschopplich.seo-audit.results.seo")
                    : panel.t("johannschopplich.seo-audit.results.readability")
              }}
            </h2>
          </k-text>
          <div>
            <LicensingButtonGroup
              v-if="licenseStatus !== undefined"
              label="Kirby SEO Audit"
              api-namespace="__seo-audit__"
              :license-status="licenseStatus"
              pricing-url="https://kirby.tools/seo-audit/buy"
            />
          </div>
        </div>
      </template>
    </AuditResult>
  </k-dialog>
</template>
