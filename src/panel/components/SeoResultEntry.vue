<script setup>
import { computed } from "kirbyuse";
import SeoRatingBubble from "./SeoRatingBubble.vue";

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
});

const parseText = computed(() => {
  // Remove aggressive exclamation mark at the end of the text
  const text = props.result.text.replace(/!$/, ".");
  return props.links ? text : stripTags(text);
});

function stripTags(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
</script>

<template>
  <div class="ksr-flex ksr-items-start ksr-gap-2">
    <SeoRatingBubble class="ksr-mx-1 ksr-shrink-0" :rating="result.rating" />
    <div v-html="parseText" />
  </div>
</template>
