<script setup lang="ts">
import type { PropType } from "vue";
import type { Report, ReportLabels } from "../../types";
import { CATEGORIES } from "../../constants";
import RatingLight from "./RatingLight.vue";

defineProps({
  ratings: {
    type: Object as PropType<Report["ratings"]>,
    required: true,
  },
  labels: {
    type: Object as PropType<ReportLabels>,
    required: true,
  },
});
</script>

<template>
  <div
    class="ksr-flex ksr-flex-wrap ksr-gap-x-[var(--spacing-4)] ksr-gap-y-[var(--spacing-1)]"
  >
    <template v-for="category in CATEGORIES" :key="category">
      <span
        v-if="ratings[category]"
        class="ksr-inline-flex ksr-items-center ksr-gap-[var(--spacing-2)]"
      >
        <RatingLight
          :rating="ratings[category].rating"
          class="ksr-size-[var(--spacing-3)]"
        />
        <span class="ksr-inline-flex ksr-gap-[var(--spacing-2)]">
          <strong>{{ labels.categories[category] }}</strong>
          <span>{{ labels.ratings[ratings[category].rating] }}</span>
        </span>
      </span>
    </template>
  </div>
</template>
