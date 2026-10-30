<script setup lang="ts">
import type { PropType } from "vue";
import type { Report, ReportLabels, ResultRating } from "../../types";
import { computed, toRaw } from "vue";
import { groupResultsByRating } from "../../utils/seo-filter";
import ResultItem from "./ResultItem.vue";

const props = defineProps({
  results: {
    type: Object as PropType<Report["results"]>,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
  labels: {
    type: Object as PropType<ReportLabels>,
    required: true,
  },
});

const RATING_BADGE_COLOR_MAP: Partial<Record<ResultRating, string>> = {
  good: "green",
  ok: "orange",
  bad: "red",
};

const ratingGroups = computed(() => {
  const resultsByRating = groupResultsByRating(
    Object.values(props.results)
      .flat()
      .map((item) => toRaw(item)),
  );

  return (Object.keys(resultsByRating) as ResultRating[]).map((rating) => ({
    rating,
    results: resultsByRating[rating]!,
  }));
});
</script>

<template>
  <div>
    <slot name="header" />

    <k-text
      class="ksr-pb-[var(--spacing-2)] [&>div+div]:ksr-mt-[var(--spacing-4)]"
      :style="{
        '--link-color': 'var(--color-text)',
        '--link-color-hover':
          'light-dark(var(--color-blue-800), var(--color-blue-500))',
      }"
    >
      <div v-for="(group, groupIndex) in ratingGroups" :key="group.rating">
        <div
          class="ksr-mb-[var(--spacing-2)] ksr-inline-flex ksr-items-center ksr-gap-[var(--spacing-2)]"
        >
          <h3
            class="!ksr-leading-[var(--text-line-height)]"
            style="color: var(--color-text); font-size: var(--text-font-size)"
          >
            {{ labels.ratings[group.rating] }}
          </h3>

          <span
            class="k-button-badge ksr-[font-weight:var(--font-semi)] ksr-static ksr-transform-none ksr-shadow-none"
            :data-theme="RATING_BADGE_COLOR_MAP[group.rating]"
          >
            {{ group.results.length }}
          </span>
        </div>

        <ResultItem
          v-for="(resultItem, resultIndex) in group.results"
          :key="resultIndex"
          :result="resultItem"
          :links="links"
          :issues-label="labels.issues"
        />

        <hr
          v-if="groupIndex < ratingGroups.length - 1"
          class="ksr-my-[var(--spacing-4)]"
        />
      </div>
    </k-text>

    <slot name="footer" />
  </div>
</template>
