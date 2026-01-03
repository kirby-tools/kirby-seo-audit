/* eslint-disable no-restricted-globals */
import {
  AnalysisWebWorker,
  assessments,
  helpers,
  languageProcessing,
} from "./yoastseo-repo/packages/yoastseo/src/index.js";
import DefaultResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/_default/Researcher";
import ArabicResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/ar/Researcher";
import CatalanResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/ca/Researcher";
import CzechResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/cs/Researcher";
import GermanResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/de/Researcher";
import GreekResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/el/Researcher";
import EnglishResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/en/Researcher";
import SpanishResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/es/Researcher";
import FarsiResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/fa/Researcher";
import FrenchResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/fr/Researcher";
import HebrewResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/he/Researcher";
import HungarianResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/hu/Researcher";
import IndonesianResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/id/Researcher";
import ItalianResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/it/Researcher";
import JapaneseResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/ja/Researcher";
import NorwegianResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/nb/Researcher";
import DutchResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/nl/Researcher";
import PolishResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/pl/Researcher";
import PortugueseResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/pt/Researcher";
import RussianResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/ru/Researcher";
import SlovakResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/sk/Researcher";
import SwedishResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/sv/Researcher";
import TurkishResearcher from "./yoastseo-repo/packages/yoastseo/src/languageProcessing/languages/tr/Researcher";

/// keep-sorted
const researchers = {
  ar: ArabicResearcher,
  ca: CatalanResearcher,
  cs: CzechResearcher,
  de: GermanResearcher,
  el: GreekResearcher,
  en: EnglishResearcher,
  es: SpanishResearcher,
  fa: FarsiResearcher,
  fr: FrenchResearcher,
  he: HebrewResearcher,
  hu: HungarianResearcher,
  id: IndonesianResearcher,
  it: ItalianResearcher,
  ja: JapaneseResearcher,
  nb: NorwegianResearcher,
  nl: DutchResearcher,
  pl: PolishResearcher,
  pt: PortugueseResearcher,
  ru: RussianResearcher,
  sk: SlovakResearcher,
  sv: SwedishResearcher,
  tr: TurkishResearcher,
};

const researchersMap = new Map(Object.entries(researchers));

// Important: `AnalysisWebWorker` strictly expects the `onmessage` function as part of the scope!
self.onmessage = (event) => {
  const language = event.data.language;
  const Researcher = getResearcher(language);

  const worker = new AnalysisWebWorker(self, new Researcher());
  registerPremiumAssessments(worker, language);

  worker.register();
};

function getResearcher(language) {
  if (researchersMap.has(language)) {
    if (typeof researchersMap.get(language) === "function") {
      return researchersMap.get(language);
    }
  }

  return DefaultResearcher;
}

function registerPremiumAssessments(worker, language) {
  const {
    getLanguagesWithWordComplexity,
    getWordComplexityConfig,
    getWordComplexityHelper,
  } = helpers;

  // Assessments
  const WordComplexityAssessment =
    assessments.readability.WordComplexityAssessment;
  const KeyphraseDistributionAssessment =
    assessments.seo.KeyphraseDistributionAssessment;

  // Researches
  const wordComplexity = languageProcessing.researches.wordComplexity;
  const keyPhraseDistribution =
    languageProcessing.researches.keyphraseDistribution;

  const pluginName = "YoastSEOPremium";

  if (getLanguagesWithWordComplexity().includes(language)) {
    // Get the word complexity config for the specific language.
    const wordComplexityConfig = getWordComplexityConfig(language);
    // Get the word complexity helper for the specific language.
    const wordComplexityHelper = getWordComplexityHelper(language);
    // Initialize the assessment for regular content.
    const wordComplexityAssessment = new WordComplexityAssessment();
    // Initialize the assessment for cornerstone content.
    const wordComplexityAssessmentCornerstone = new WordComplexityAssessment({
      scores: {
        acceptableAmount: 3,
      },
    });

    // Register the word complexity config.
    worker.registerResearcherConfig("wordComplexity", wordComplexityConfig);

    // Register the word complexity helper.
    worker.registerHelper("checkIfWordIsComplex", wordComplexityHelper);

    // Register the word complexity research.
    worker.registerResearch("wordComplexity", wordComplexity);

    // Register the word complexity assessment for regular content.
    worker.registerAssessment(
      "wordComplexity",
      wordComplexityAssessment,
      pluginName,
      "readability",
    );

    // Register the word complexity assessment for cornerstone content.
    worker.registerAssessment(
      "wordComplexity",
      wordComplexityAssessmentCornerstone,
      pluginName,
      "cornerstoneReadability",
    );
  }

  const keyphraseDistributionAssessment = new KeyphraseDistributionAssessment();
  worker.registerResearch("keyphraseDistribution", keyPhraseDistribution);
  worker.registerAssessment(
    "keyphraseDistributionAssessment",
    keyphraseDistributionAssessment,
    pluginName,
    "seo",
  );
}
