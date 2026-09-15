<script setup lang="ts">
import type { PropType } from "vue";
import type { Report, ResultRating } from "../../types";
import { computed, toRaw, usePanel } from "kirbyuse";
import { groupResultsByRating } from "../../utils/seo-filter";
import AuditResultItem from "./AuditResultItem.vue";

const props = defineProps({
  results: {
    type: Object as PropType<Report["results"]>,
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

const RATING_BADGE_COLOR_MAP: Partial<Record<ResultRating, string>> = {
  good: "green",
  ok: "orange",
  bad: "red",
};

const panel = usePanel();

const resultsByRating = computed(() =>
  groupResultsByRating(
    Object.values(props.results)
      .flat()
      .map((item) => toRaw(item)),
  ),
);
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
          resultsByRating,
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
            {{ resultsByRating[ratingCategory].length }}
          </span>
        </div>

        <AuditResultItem
          v-for="(resultItem, resultIndex) in resultsByRating[ratingCategory]"
          :key="resultIndex"
          :result="resultItem"
          :links="links"
        />

        <hr
          v-if="ratingCategoryIndex < Object.keys(resultsByRating).length - 1"
          class="ksr-my-4"
          :style="{
            background: isDialog
              ? undefined
              : 'light-dark(var(--color-gray-350), var(--color-border))',
          }"
        />
      </div>
    </k-text>

    <slot name="footer" />
  </div>
</template>
