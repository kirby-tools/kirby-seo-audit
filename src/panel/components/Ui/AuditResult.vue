<script setup>
import { computed, toRaw, usePanel } from "kirbyuse";
import AuditResultItem from "./AuditResultItem.vue";

const props = defineProps({
  report: {
    type: Object,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
  isDialog: {
    type: Boolean,
    default: false,
  },
});

const RATING_BADGE_COLOR_MAP = {
  good: "green",
  ok: "orange",
  bad: "red",
};

const panel = usePanel();

const categorizedReport = computed(() =>
  Object.values(props.report)
    .flat()
    .reduce((acc, item) => {
      acc[item.rating] ||= [];
      acc[item.rating].push(toRaw(item));
      return acc;
    }, {}),
);
</script>

<template>
  <div>
    <slot name="header" />

    <k-text
      class="ksr-space-y-4 ksr-pb-2"
      :style="{
        '--link-color': 'var(--color-text)',
        '--link-color-hover':
          'light-dark(var(--color-blue-800), var(--color-blue-500))',
      }"
    >
      <div
        v-for="(ratingCategory, ratingCategoryIndex) in Object.keys(
          categorizedReport,
        )"
        :key="ratingCategory"
      >
        <div class="ksr-mb-2 ksr-inline-flex ksr-items-center">
          <h3
            class="ksr-mr-1.5 !ksr-leading-[var(--text-line-height)]"
            style="color: var(--color-text); font-size: var(--text-font-size)"
          >
            {{ panel.t(`johannschopplich.seo-audit.rating.${ratingCategory}`) }}
          </h3>

          <span
            class="k-seo-audit-badge"
            :data-theme="RATING_BADGE_COLOR_MAP[ratingCategory]"
          >
            {{ categorizedReport[ratingCategory].length }}
          </span>
        </div>

        <AuditResultItem
          v-for="(resultItem, resultIndex) in categorizedReport[ratingCategory]"
          :key="resultIndex"
          :result="resultItem"
          :links="links"
        />

        <hr
          v-if="ratingCategoryIndex < Object.keys(categorizedReport).length - 1"
          class="ksr-my-4"
          :style="{
            background: isDialog
              ? undefined
              : 'light-dark(var(--color-gray-350), var(--color-border))',
          }"
        />
      </div>
    </k-text>
  </div>
</template>

<style>
.k-seo-audit-badge {
  min-width: 1em;
  min-height: 1em;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  padding: 0 var(--spacing-1);
  border-radius: 1em;
  text-align: center;
  font-size: 0.6rem;
  font-weight: var(--font-semi);
  background: var(--theme-color-back);
  border: 1px solid light-dark(var(--theme-color-500), var(--color-black));
  color: var(--theme-color-text-highlight);
  z-index: 1;
}
</style>
