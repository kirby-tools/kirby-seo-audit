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

const categorizedReport = computed(() => {
  const grouped = Object.values(props.report)
    .flat()
    .reduce(
      (acc, item) => {
        acc[item.rating].push(toRaw(item));
        return acc;
      },
      {
        good: [],
        ok: [],
        bad: [],
        feedback: [],
      },
    );

  return Object.fromEntries(
    Object.entries(grouped).filter(([, items]) => items.length > 0),
  );
});
</script>

<template>
  <div>
    <slot name="header" />

    <k-text
      class="ksr-pb-2 [&>div+div]:ksr-mt-[var(--spacing-4)]"
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
        <div class="ksr-mb-2 ksr-inline-flex ksr-items-center ksr-gap-1.5">
          <h3
            class="!ksr-leading-[var(--text-line-height)]"
            style="color: var(--color-text); font-size: var(--text-font-size)"
          >
            {{ panel.t(`johannschopplich.seo-audit.rating.${ratingCategory}`) }}
          </h3>

          <span
            class="k-button-badge ksr-[font-weight:var(--font-semi)] ksr-static ksr-transform-none ksr-shadow-none"
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
