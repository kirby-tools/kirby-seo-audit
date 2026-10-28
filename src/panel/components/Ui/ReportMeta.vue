<script setup lang="ts">
import type { PropType } from "vue";
import type { AuditLabels, ContentVersion } from "../../types";
import { computed } from "vue";
import { formatReportMeta } from "../../utils/audit-labels";

const props = defineProps({
  version: String as PropType<ContentVersion>,
  timestamp: {
    type: Number,
    required: true,
  },
  isStale: Boolean,
  labels: {
    type: Object as PropType<AuditLabels>,
    required: true,
  },
});

const text = computed(() => formatReportMeta(props, props.labels));
</script>

<template>
  <span>{{ text }}</span>
</template>
