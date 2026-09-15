<script setup lang="ts">
import type { PropType } from "vue";
import type { Category, Report } from "../../types";
import { usePanel } from "kirbyuse";
import RatingStatus from "./RatingStatus.vue";

defineProps({
  ratings: {
    type: Object as PropType<Report["ratings"]>,
    required: true,
  },
});

const CATEGORIES: Category[] = ["seo", "readability"];

const panel = usePanel();
</script>

<template>
  <div class="ksr-flex ksr-flex-wrap ksr-gap-x-4 ksr-gap-y-1">
    <template v-for="category in CATEGORIES">
      <span
        v-if="ratings[category]"
        :key="category"
        class="ksr-inline-flex ksr-items-center ksr-gap-1.5"
      >
        <RatingStatus :rating="ratings[category].rating" class="ksr-size-3" />
        <span>
          {{ panel.t(`johannschopplich.seo-audit.category.${category}`) }}:
          {{
            panel.t(
              `johannschopplich.seo-audit.rating.${ratings[category].rating}`,
            )
          }}
        </span>
      </span>
    </template>
  </div>
</template>
