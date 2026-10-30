<script setup lang="ts">
import type { PropType } from "vue";
import type { ContentVersion, Report, ReportLabels } from "../../types";
import { computed } from "vue";
import { reportHeading } from "../../utils/report-labels";
import ReportMeta from "./ReportMeta.vue";
import ReportRatings from "./ReportRatings.vue";
import ResultList from "./ResultList.vue";

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
    type: Object as PropType<ReportLabels>,
    required: true,
  },
});

const heading = computed(() => reportHeading(props.results, props.labels));
</script>

<template>
  <ResultList :results="results" :links="links" :labels="labels">
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
  </ResultList>
</template>
