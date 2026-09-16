/* eslint-disable no-restricted-globals */
import {
  AnalysisWebWorker,
  assessments,
  helpers,
  languageProcessing,
} from "./yoastseo-repo/packages/yoastseo/src/index.js";
import getResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/getResearcher";

// Important: `AnalysisWebWorker` strictly expects the `onmessage` function as part of the scope.
self.onmessage = (event) => {
  const language = event.data.language;
  const Researcher = getResearcher(language);

  const worker = new AnalysisWebWorker(self, new Researcher());
  registerPremiumAssessments(worker, language);

  worker.register();
};

function registerPremiumAssessments(worker, language) {
  const {
    getLanguagesWithWordComplexity,
    getWordComplexityConfig,
    getWordComplexityHelper,
  } = helpers;

  const WordComplexityAssessment =
    assessments.readability.WordComplexityAssessment;
  const KeyphraseDistributionAssessment =
    assessments.seo.KeyphraseDistributionAssessment;

  const wordComplexity = languageProcessing.researches.wordComplexity;
  const keyphraseDistribution =
    languageProcessing.researches.keyphraseDistribution;

  const pluginName = "YoastSEOPremium";

  if (getLanguagesWithWordComplexity().includes(language)) {
    const wordComplexityConfig = getWordComplexityConfig(language);
    const wordComplexityHelper = getWordComplexityHelper(language);
    const wordComplexityAssessment = new WordComplexityAssessment();

    worker.registerResearcherConfig("wordComplexity", wordComplexityConfig);

    worker.registerHelper("checkIfWordIsComplex", wordComplexityHelper);

    worker.registerResearch("wordComplexity", wordComplexity);

    worker.registerAssessment(
      "wordComplexity",
      wordComplexityAssessment,
      pluginName,
      "readability",
    );
  }

  const keyphraseDistributionAssessment = new KeyphraseDistributionAssessment();
  worker.registerResearch("keyphraseDistribution", keyphraseDistribution);
  worker.registerAssessment(
    "keyphraseDistributionAssessment",
    keyphraseDistributionAssessment,
    pluginName,
    "seo",
  );
}
