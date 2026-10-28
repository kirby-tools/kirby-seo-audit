<script setup lang="ts">
import { useContent } from "kirbyuse";
import {
  help as helpProp,
  id as idProp,
  label as labelProp,
  name as nameProp,
} from "kirbyuse/props";
import { computed } from "vue";

defineProps({
  ...helpProp,
  ...idProp,
  ...labelProp,
  ...nameProp,
});

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
  <k-field
    :id="id"
    :help="help"
    :input="false"
    :label="label"
    :name="name"
    type="playground-blueprint-code"
  >
    <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
    <k-code language="yaml">{{ code }}</k-code>
  </k-field>
</template>
