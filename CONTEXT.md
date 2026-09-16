# Kirby SEO Audit

SEO and readability analysis of the HTML behind a page's or the site's preview URL, inside the Kirby Panel, run with Yoast's assessments and the plugin's own and kept as a rating per model and language.

## Language

**Analysis**:
One run of the assessments over the preview HTML, started by an editor or by a publish.
_Avoid_: audit (the product name), check

**Analyzed version**:
The content version the preview served the analysis: the unsaved changes once the form differs from the published content, otherwise the published content.
_Avoid_: draft, preview version

**Document locale**:
The language the preview HTML declares. It decides which assessments can score the page and how strictly readability is judged – not the Panel language and not the content language.
_Avoid_: page language, analysis language

**Assessment**:
One check an analysis runs, such as text length or keyphrase density. It belongs to a category and yields a result.
_Avoid_: rule, test

**Category**:
The SEO or the readability half of an analysis. Each gets its own traffic light.

**Result**:
The score and text an assessment yields for the page.
_Avoid_: finding

**Report**:
All results of an analysis grouped by traffic light, with the light of each category, the analyzed version and the time.

**Traffic light**:
The verdict good, ok or bad that a result, a category and a rating carry. A result with nothing to judge is feedback, a failed assessment an error, a category that could not be scored has none, and a category without results has no light. Code and translation keys spell it `rating`.
_Avoid_: grade, status

**Score**:
A number behind a traffic light: Yoast's per result, the aggregate per category, and the small number a rating offers to sort pages by.

**Rating**:
What an analysis leaves behind: one traffic light per category, how many results came out good, ok or bad, the analyzed version and the time. One per page or site and language, stored only for an editor who may update the model. It reads as the worse of its lights, or as nothing before the first analysis.
_Avoid_: audit result

**Stale**:
A rating older than the last change to the published content it describes.
_Avoid_: outdated, dirty

**Keyphrase**:
The term the editor wants the page to rank for. Without one the keyphrase assessments drop out, unless the blueprint names assessments itself.
_Avoid_: keyword (except as Yoast's option name), focus keyword

**Automatic analysis**:
An analysis nobody started: the plugin runs it silently after the editor publishes their changes, when `analyzeOn` asks for it.
_Avoid_: background analysis, auto audit
