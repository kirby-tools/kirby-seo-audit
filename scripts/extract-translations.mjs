import { GettextExtractor, JsExtractors } from "gettext-extractor";
import { glob } from "tinyglobby";
import { assertYoastseoCheckout, YOASTSEO_SRC_DIR } from "./yoastseo.mjs";

assertYoastseoCheckout();

const extractor = new GettextExtractor();

const parser = extractor.createJsParser([
  JsExtractors.callExpression("__", {
    arguments: {
      text: 0,
      context: 1,
    },
  }),
  JsExtractors.callExpression("sprintf", {
    arguments: {
      text: 0,
      context: 1,
    },
  }),
  JsExtractors.callExpression("_n", {
    arguments: {
      text: 0,
      textPlural: 1,
      count: 2,
      context: 3,
    },
  }),
]);

const files = await glob("**/*.js", { cwd: YOASTSEO_SRC_DIR, absolute: true });

console.log(`Processing ${files.length} files…`);

for (const file of files) {
  parser.parseFile(file);
}

extractor.savePotFile("./messages.pot");

extractor.printStats();
