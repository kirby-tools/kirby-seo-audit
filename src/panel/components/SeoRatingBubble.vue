<script setup>
defineProps({
  rating: {
    type: String,
    required: true,
  },
});

const colorMap = {
  good: "green",
  ok: "orange",
  bad: "red",
};
</script>

<template>
  <div
    class="ksr-mt-[0.375em] ksr-h-[12px] ksr-w-[12px] ksr-rounded-full"
    :style="{
      backgroundColor: `var(--color-${colorMap[rating] ?? 'gray'}-600)`,
    }"
  >
    <span class="ksr-sr-only">{{ rating }}</span>
  </div>
</template>
