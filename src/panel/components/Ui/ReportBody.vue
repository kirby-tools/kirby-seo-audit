<script setup lang="ts">
import type { PropType } from "vue";
import type { AuditLabels, ContentVersion, Report } from "../../types";
import { computed } from "vue";
import { reportHeading } from "../../utils/audit-labels";
import AuditResult from "./AuditResult.vue";
import ReportMeta from "./ReportMeta.vue";
import ReportRatings from "./ReportRatings.vue";

const props = defineProps({
  results: {
    type: Object as PropType<Report["results"]>,
    required: true,
  },
  ratings: Object as PropType<Report["ratings"]>,
  version: String as PropType<ContentVersion>,
  timestamp: Number,
  links: {
    type: Boolean,
    default: true,
  },
  labels: {
    type: Object as PropType<AuditLabels>,
    required: true,
  },
});

const heading = computed(() => reportHeading(props.results, props.labels));
</script>

<template>
  <AuditResult :results="results" :links="links" :labels="labels">
    <template #header>
      <div
        class="ksr-mb-[var(--spacing-6)] ksr-flex ksr-items-start ksr-justify-between"
      >
        <k-text>
          <h2>{{ heading }}</h2>
          <ReportRatings
            v-if="ratings"
            :ratings="ratings"
            :labels="labels"
            class="ksr-mt-[var(--spacing-3)]"
          />
        </k-text>
        <slot name="options" />
      </div>
    </template>
    <template v-if="timestamp" #footer>
      <p
        class="ksr-mt-[var(--spacing-4)] ksr-text-[color:var(--color-text-dimmed)]"
      >
        <ReportMeta
          :version="version"
          :timestamp="timestamp"
          :labels="labels"
        />
      </p>
    </template>
  </AuditResult>
</template>
