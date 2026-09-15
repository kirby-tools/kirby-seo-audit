<script setup>
import { computed, usePanel } from "kirbyuse";

const props = defineProps({
  version: String,
  timestamp: {
    type: Number,
    required: true,
  },
  isStale: Boolean,
});

const panel = usePanel();

const { format } = new Intl.DateTimeFormat(
  panel.translation.code.replace("_", "-"),
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
