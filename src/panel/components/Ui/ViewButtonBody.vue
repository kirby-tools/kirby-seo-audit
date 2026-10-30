<script setup lang="ts">
import type { PropType } from "vue";
import type { CategoryRating, Rating } from "../../types";
import { computed } from "vue";
import { worstRating } from "../../utils/seo-score";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: "positive-icon",
  },
  rating: Object as PropType<Rating>,
  isAnalyzing: Boolean,
});

const emit = defineEmits<{
  (event: "click"): void;
}>();

const BADGE_THEMES: Record<CategoryRating, string> = {
  good: "positive",
  ok: "notice",
  bad: "negative",
  none: "passive",
};

const badge = computed(() => {
  if (!props.rating?.timestamp) return undefined;

  return {
    theme: BADGE_THEMES[worstRating(props.rating)],
    text: props.rating.isStale ? "!" : undefined,
  };
});
</script>

<template>
  <k-button
    :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
    :text="label"
    :theme="theme"
    :badge="badge"
    :disabled="isAnalyzing"
    variant="filled"
    size="sm"
    responsive
    @click="emit('click')"
  />
</template>
