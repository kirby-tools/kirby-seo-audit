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
    <LicensingButtonGroup
      v-if="licenseStatus !== undefined"
      label="Kirby SEO Audit"
      api-namespace="__seo-audit__"
      :license-status="licenseStatus"
      pricing-url="https://kirby.tools/seo-audit/buy"
      :class="[
        licenseStatus !== undefined &&
          currentLicenseStatus !== 'active' &&
          'ksr-mb-4',
      ]"
    />

    <AuditResult :report="report" :links="links" is-dialog>
      <template #header>
        <h2>{{ panel.t("johannschopplich.seo-audit.results") }}</h2>
      </template>
    </AuditResult>
  </k-dialog>
</template>

<style>
.k-seo-audit-report-dialog .k-button-group > .k-button {
  flex-grow: 1;
}
</style>
