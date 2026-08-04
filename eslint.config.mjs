import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: false,
  unocss: true,
  vue: {
    // https://github.com/antfu/eslint-config/issues/367
    sfcBlocks: {
      blocks: {
        styles: false,
      },
    },
    vueVersion: 2,
  },
  ignores: ["**/vendor/**", "index.js"],
})
  .append({
    languageOptions: {
      // Build-time constants injected by `kirbyup.config.js`
      globals: {
        __PLAYGROUND__: "readonly",
        __ZERO_ONE__: "readonly",
      },
    },
    rules: {
      "e18e/prefer-static-regex": "off",
    },
  })
  .append({
    files: ["**/*.vue"],
    rules: {
      // Ignore rules clashing with Prettier
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": "off",
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  });
