<script setup lang="ts">
import type { PropType } from "vue";
import type { Result, ResultRating } from "../../types";
import { computed, usePanel } from "kirbyuse";
import RatingStatus from "./RatingStatus.vue";

const props = defineProps({
  result: {
    type: Object as PropType<Result & { rating: ResultRating }>,
    required: true,
  },
  links: {
    type: Boolean,
    default: true,
  },
});

const panel = usePanel();

const displayText = computed(() => {
  const text = replaceTrailingExclamation(props.result.text);
  return props.links ? text : stripTags(text);
});

function replaceTrailingExclamation(text: string) {
  return text.replace(/!$/, ".");
}

function stripTags(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
</script>

<template>
  <div class="ksr-flex ksr-items-start ksr-gap-2">
    <RatingStatus :rating="result.rating" class="ksr-mt-1 ksr-size-3" />

    <div>
      <div v-html="displayText" />
      <details v-if="result.details">
        <summary class="ksr-[font-weight:var(--font-semi)]">
          {{ panel.t("johannschopplich.seo-audit.issues") }}
        </summary>
        <k-box
          data-theme="passive"
          :text="result.details.text"
          html
          class="ksr-my-1"
        />
      </details>
    </div>
  </div>
</template>
