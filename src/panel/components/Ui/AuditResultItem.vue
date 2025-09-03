<script setup>
import { computed, usePanel } from "kirbyuse";
import RatingStatus from "./RatingStatus.vue";

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

const panel = usePanel();

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
    <RatingStatus :rating="result.rating" class="ksr-mt-1 ksr-size-3" />

    <div>
      <div v-html="parseText" />
      <details v-if="result.details">
        <summary>{{ panel.t("johannschopplich.seo-audit.issues") }}</summary>
        <div
          class="ksr-mb-1 ksr-rounded-[var(--rounded)] ksr-bg-[var(--color-border)] ksr-py-0.5"
          v-html="result.details.text"
        />
      </details>
    </div>
  </div>
</template>
