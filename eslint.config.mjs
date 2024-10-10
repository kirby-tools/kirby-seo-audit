import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: false,
  vue: {
    // https://github.com/antfu/eslint-config/issues/367
    sfcBlocks: {
      blocks: {
        styles: false,
      },
    },
    vueVersion: 2,
  },
  ignores: [
    "**/assets/**",
    "**/src/panel/**/*.d.ts",
    "**/vendor/**",
    "index.js",
  ],
}).append({
  files: ["**/*.vue"],
  rules: {
    "vue/html-self-closing": "off",
    "vue/html-indent": "off",
  },
});
