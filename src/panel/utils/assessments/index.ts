import type { AssessmentContext, AssessmentResult } from "../../types";

/**
 * Checks that the content has exactly one H1 heading.
 */
export function singleH1({
  htmlDocument,
  contentSelector,
}: AssessmentContext): AssessmentResult {
  const h1s = queryContentElements(htmlDocument, contentSelector, "h1");

  return {
    score: h1s.length === 1 ? 9 : 3,
    translation:
      h1s.length === 1 ? "one" : h1s.length > 1 ? "multiple" : "none",
  };
}

/**
 * Checks whether all images have an `alt` attribute.
 */
export function altAttribute({
  htmlDocument,
  contentSelector,
}: AssessmentContext): AssessmentResult {
  const images = queryContentElements(htmlDocument, contentSelector, "img");

  if (images.length === 0) {
    return {
      score: 9,
      translation: "na",
    };
  }

  const imagesWithoutAltAttributeCount = images.filter(
    (image) => image.getAttribute("alt") === null,
  ).length;

  return {
    score: imagesWithoutAltAttributeCount > 0 ? 3 : 9,
    translation:
      imagesWithoutAltAttributeCount === images.length
        ? "none"
        : imagesWithoutAltAttributeCount > 0
          ? "some"
          : "every",
    ...(imagesWithoutAltAttributeCount > 0 && {
      context: {
        imagesWithoutAltAttribute: imagesWithoutAltAttributeCount,
      },
    }),
  };
}

/**
 * Checks whether the headings (H1 to H6) follow a proper sequential order.
 */
export function headingStructureOrder({
  htmlDocument,
  contentSelector,
}: AssessmentContext): AssessmentResult {
  const headings = queryContentElements(
    htmlDocument,
    contentSelector,
    "h1, h2, h3, h4, h5, h6",
  );

  let previousLevel = 0;
  const issues: Element[] = [];

  for (const heading of headings) {
    const currentLevel = Number.parseInt(heading.tagName.substring(1), 10);
    if (currentLevel - previousLevel > 1) {
      issues.push(heading);
    }
    previousLevel = currentLevel;
  }

  const isSequential = issues.length === 0;

  return {
    score: isSequential ? 9 : 3,
    translation: isSequential ? "sequential" : "nonSequential",
    ...(!isSequential && {
      details: {
        text: `<ul>${issues
          .map(
            (heading) =>
              `<li><strong>${heading.tagName}</strong>: ${escapeHtml(heading.textContent)}</li>`,
          )
          .join("")}</ul>`,
      },
    }),
  };
}

/**
 * Collects the elements matching `selector` inside the content, including
 * content elements that match it themselves.
 */
function queryContentElements(
  htmlDocument: Document,
  contentSelector: string,
  selector: string,
) {
  return [...htmlDocument.querySelectorAll(contentSelector)].flatMap(
    (element) =>
      element.matches(selector)
        ? [element]
        : [...element.querySelectorAll(selector)],
  );
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
