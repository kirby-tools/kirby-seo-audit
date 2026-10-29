<script setup lang="ts">
import type { PropType } from "vue";
import type { ContentVersion } from "../../types";
import { computed, usePanel } from "kirbyuse";

const props = defineProps({
  version: String as PropType<ContentVersion>,
  timestamp: {
    type: Number,
    required: true,
  },
  isStale: Boolean,
});

const panel = usePanel();

const { format } = new Intl.DateTimeFormat(
  // Kirby's `sr@latin` is not a BCP 47 tag.
  panel.translation.code.replace("_", "-").replace("@latin", "-Latn"),
  {
    dateStyle: "short",
    timeStyle: "short",
  },
);

const text = computed(() =>
  [
    props.version &&
      panel.t(`johannschopplich.seo-audit.version.${props.version}`),
    format(props.timestamp),
    props.isStale && panel.t("johannschopplich.seo-audit.rating.stale"),
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>

<template>
  <span>{{ text }}</span>
</template>
