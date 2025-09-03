<script setup>
defineProps({
  rating: {
    type: String,
    required: true,
  },
});

const RATING_COLOR_MAP = {
  good: "green",
  ok: "orange",
  bad: "red",
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
