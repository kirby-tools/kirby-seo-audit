<script setup>
import { LicensingButtonGroup } from "@kirby-tools/licensing/components";
import { ref, usePanel } from "kirbyuse";
import { usePluginContext } from "../../composables";
import ResultItem from "../Ui/ResultItem.vue";

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

const REPORT_SECTIONS = [
  {
    category: "seo",
    label: "SEO",
  },
  {
    category: "readability",
    label: panel.t("johannschopplich.seo-audit.category.readability"),
  },
];

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

    <k-text
      class="ksr-space-y-4"
      :style="{
        '--link-color': 'var(--color-text)',
        '--link-color-hover':
          'light-dark(var(--color-blue-800), var(--color-blue-500))',
      }"
    >
      <h2>{{ panel.t("johannschopplich.seo-audit.results") }}</h2>

      <div
        v-for="(section, sectionIndex) in REPORT_SECTIONS"
        :key="section.category"
      >
        <div v-if="report[section.category].length > 0">
          <h3
            class="ksr-mb-1 !ksr-leading-[var(--leading-normal)]"
            style="
              font-size: var(--text-base);
              line-height: var(--leading-normal);
            "
          >
            {{ section.label }}
          </h3>

          <ResultItem
            v-for="(item, index) in report[section.category]"
            :key="index"
            :result="item"
            :links="links"
          />
        </div>

        <hr v-if="sectionIndex < REPORT_SECTIONS.length - 1" class="ksr-my-4" />
      </div>
    </k-text>
  </k-dialog>
</template>

<style>
.k-seo-audit-report-dialog .k-button-group > .k-button {
  flex-grow: 1;
}
</style>
