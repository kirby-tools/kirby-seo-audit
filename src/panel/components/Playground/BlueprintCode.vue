<script lang="ts">
import { computed, ref, useContent, useSection } from "kirbyuse";
import { section } from "kirbyuse/props";

const propsDefinition = {
  ...section,
};

export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
const props = defineProps(propsDefinition);
const data = ref<{ label?: string; help?: string }>({});

(async () => {
  const { load } = useSection();
  data.value = await load({
    parent: props.parent!,
    name: props.name!,
  });
})();

const { currentContent } = useContent();

const code = computed(() =>
  `
seoAudit:
  type: seo-audit
  # Optional property for keyphrase assessments
  keyphraseField: metaKeyphrase
  # Optional property to add keyword/keyphrase synonyms
  synonymsField: metaSynonyms
  links: ${currentContent.value.links}
  ${
    Array.isArray(currentContent.value.assessments) &&
    currentContent.value.assessments.length
      ? `assessments:\n${currentContent.value.assessments
          .map((i: string) => `    - ${i}`)
          .join("\n")}`
      : ""
  }
`.trim(),
);
</script>

<template>
  <k-section :label="data.label" class="[&>*+*]:ksr-mt-[var(--spacing-2)]">
    <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
    <k-code language="yaml">{{ code }}</k-code>
    <k-text v-if="data.help" class="k-help">
      {{ data.help }}
    </k-text>
  </k-section>
</template>
