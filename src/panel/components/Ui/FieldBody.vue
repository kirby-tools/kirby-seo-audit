<script setup lang="ts">
import type { PropType } from "vue";
import type { ContentVersion, Report, ReportLabels } from "../../types";
import {
  help as helpProp,
  id as idProp,
  name as nameProp,
} from "kirbyuse/props";
import ReportMeta from "./ReportMeta.vue";
import ReportRatings from "./ReportRatings.vue";
import ResultList from "./ResultList.vue";

defineProps({
  ...helpProp,
  ...idProp,
  ...nameProp,
  label: {
    type: String,
    required: true,
  },
  labels: {
    type: Object as PropType<ReportLabels>,
    required: true,
  },
  isAnalyzing: Boolean,
  results: Object as PropType<Report["results"]>,
  ratings: Object as PropType<Report["ratings"]>,
  version: String as PropType<ContentVersion>,
  timestamp: Number,
  isStale: Boolean,
  links: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  (event: "analyze"): void;
}>();
</script>

<template>
  <k-field
    :id="id"
    :help="help"
    :input="false"
    :label="label"
    :name="name"
    type="seo-audit"
    class="k-seo-audit-field"
  >
    <template v-if="$slots.options" #options>
      <slot name="options" />
    </template>

    <div class="[&>*+*]:ksr-mt-[var(--spacing-4)]">
      <k-button-group layout="collapsed">
        <k-button
          :icon="isAnalyzing ? 'loader' : 'seo-audit-analyze'"
          :text="labels.analyze"
          variant="filled"
          theme="positive-icon"
          :disabled="isAnalyzing"
          @click="emit('analyze')"
        />
      </k-button-group>

      <div v-if="results && timestamp">
        <k-box
          theme="passive"
          :class="[isAnalyzing && 'ksr-pointer-events-none ksr-animate-pulse']"
        >
          <ResultList
            :key="timestamp"
            :results="results"
            :links="links"
            :labels="labels"
            :class="[isAnalyzing && 'ksr-opacity-50']"
          >
            <template v-if="ratings" #header>
              <ReportRatings
                :ratings="ratings"
                :labels="labels"
                class="ksr-mb-[var(--spacing-3)]"
              />
            </template>
          </ResultList>
        </k-box>

        <p
          class="ksr-mt-[var(--spacing-2)] ksr-text-[length:var(--text-sm)] ksr-text-[color:var(--color-text-dimmed)]"
        >
          <ReportMeta
            :version="version"
            :timestamp="timestamp"
            :is-stale="isStale"
            :labels="labels"
          />
        </p>
      </div>
    </div>
  </k-field>
</template>
