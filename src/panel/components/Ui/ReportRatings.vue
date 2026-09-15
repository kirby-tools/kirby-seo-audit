<script setup lang="ts">
import type { PropType } from "vue";
import type { Report } from "../../types";
import { usePanel } from "kirbyuse";
import { CATEGORIES } from "../../constants";
import RatingStatus from "./RatingStatus.vue";

defineProps({
  ratings: {
    type: Object as PropType<Report["ratings"]>,
    required: true,
  },
});

const panel = usePanel();
</script>

<template>
  <div
    class="ksr-flex ksr-flex-wrap ksr-gap-x-[var(--spacing-4)] ksr-gap-y-[var(--spacing-1)]"
  >
    <template v-for="category in CATEGORIES">
      <span
        v-if="ratings[category]"
        :key="category"
        class="ksr-inline-flex ksr-items-center ksr-gap-[var(--spacing-2)]"
      >
        <RatingStatus
          :rating="ratings[category].rating"
          class="ksr-size-[var(--spacing-3)]"
        />
        <span class="ksr-inline-flex ksr-gap-[var(--spacing-2)]">
          <strong>
            {{ panel.t(`johannschopplich.seo-audit.category.${category}`) }}
          </strong>
          <span>
            {{
              panel.t(
                `johannschopplich.seo-audit.rating.${ratings[category].rating}`,
              )
            }}
          </span>
        </span>
      </span>
    </template>
  </div>
</template>
