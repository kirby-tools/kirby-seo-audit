const {
  GettextExtractor,
  JsExtractors,
  HtmlExtractors,
} = require("gettext-extractor");

let extractor = new GettextExtractor();

extractor
  .createJsParser([
    JsExtractors.callExpression(
      [
        "e.dgettext",
        "i.dgettext",
        "t.dgettext",
        "a.dgettext",
        "this.i18n.dgettext",
        "this._i18n.dgettext",
        "t.dngettext",
        "i.dngettext",
        "e.dngettext",
      ],
      {
        arguments: {
          text: 1,
          context: 0,
        },
      },
    ),
  ])
  .parseFilesGlob("./files/**/*.@(ts|js|tsx|jsx)");

extractor.savePotFile("./messages.pot");

extractor.printStats();
