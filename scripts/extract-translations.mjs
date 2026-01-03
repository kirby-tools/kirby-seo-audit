import * as fsp from "node:fs/promises";
import { GettextExtractor, JsExtractors } from "gettext-extractor";
import { glob } from "tinyglobby";

const extractor = new GettextExtractor();

// Create the parser once
const parser = extractor.createJsParser([
  JsExtractors.callExpression("_i18n.__", {
    arguments: {
      text: 0,
      context: 1,
    },
  }),
  JsExtractors.callExpression("_i18n.sprintf", {
    arguments: {
      text: 0,
      context: 1,
    },
  }),
  JsExtractors.callExpression("_i18n._n", {
    arguments: {
      text: 0,
      textPlural: 1,
      count: 2,
      context: 3,
    },
  }),
]);

const files = await glob("node_modules/yoastseo/build/**/*.js");

console.log(`Processing ${files.length} files...`);

for (const file of files) {
  const preprocessedContent = await preprocessFile(file);
  parser.parseString(preprocessedContent, file);
}

extractor.savePotFile("./messages.pot");

extractor.printStats();

// Preprocess files to transform Babel patterns
async function preprocessFile(filePath) {
  let content = await fsp.readFile(filePath, "utf8");

  // Transform Babel patterns `(0, _i18n.function)` to `_i18n.function`
  const i18nFunctions = ["__", "sprintf", "_n"];

  for (const fn of i18nFunctions) {
    const escapedFn = fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    content = content.replace(
      new RegExp(`\\(0,\\s*(_i18n\\.${escapedFn})\\)`, "g"),
      "$1",
    );
  }

  return content;
}
