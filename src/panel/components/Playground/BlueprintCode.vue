<script>
import { computed, useStore } from "kirbyuse";
import { label as _label } from "kirbyuse/props";

const propsDefinition = {
  ..._label,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup>
defineProps(propsDefinition);

const store = useStore();
const currentContent = computed(() => store.getters["content/values"]());

const code = computed(() =>
  `
seoInsights:
  type: seo-insights
  # Optional if you want to omit keyphrase assessments
  keyphraseField: metaKeyphrase
  links: ${currentContent.value.links}
  ${
    Array.isArray(currentContent.value.assessments) &&
    currentContent.value.assessments.length
      ? `assessments:\n${currentContent.value.assessments
          .map((i) => `    - ${i}Assessment`)
          .join("\n")}`
      : ""
  }
`.trim(),
);
</script>

<template>
  <k-section :label="label">
    <!--  eslint-disable-next-line vue/singleline-html-element-content-newline -->
    <k-code language="yaml">{{ code }}</k-code>
  </k-section>
</template>
