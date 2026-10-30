<script setup lang="ts">
import type { PropType } from "vue";
import type { ContentVersion, ReportLabels } from "../../types";
import { computed } from "vue";
import { formatReportMeta } from "../../utils/report-labels";

const props = defineProps({
  version: String as PropType<ContentVersion>,
  timestamp: {
    type: Number,
    required: true,
  },
  isStale: Boolean,
  labels: {
    type: Object as PropType<ReportLabels>,
    required: true,
  },
});

const text = computed(() => formatReportMeta(props, props.labels));
</script>

<template>
  <span>{{ text }}</span>
</template>
