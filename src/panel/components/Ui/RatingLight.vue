<script setup lang="ts">
import type { PropType } from "vue";
import type { CategoryRating, ResultRating } from "../../types";

defineProps({
  rating: {
    type: String as PropType<ResultRating | CategoryRating>,
    required: true,
  },
});

const RATING_COLOR_MAP: Record<ResultRating | CategoryRating, string> = {
  good: "green",
  ok: "orange",
  bad: "red",
  feedback: "gray",
  error: "gray",
  none: "gray",
};
</script>

<template>
  <div
    class="ksr-shrink-0 ksr-rounded-full"
    :style="{
      backgroundColor: `var(--color-${RATING_COLOR_MAP[rating]}-600)`,
    }"
  />
</template>
