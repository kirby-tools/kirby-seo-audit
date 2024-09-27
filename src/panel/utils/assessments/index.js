/**
 * Checks whether the content contains a H1 heading.
 */
export function singleH1({ htmlDocument, contentSelector }) {
  const contentElements = [...htmlDocument.querySelectorAll(contentSelector)];
  const h1s = contentElements.flatMap((element) =>
    element.tagName.toLowerCase() === "h1"
      ? [element]
      : [...element.querySelectorAll("h1")],
  );

  return {
    score: h1s.length === 1 ? 9 : 3,
    translation:
      h1s.length === 1 ? "one" : h1s.length > 1 ? "multiple" : "none",
  };
}

/**
 * Checks whether all images have an `alt` attribute.
 */
export function altAttribute({ htmlDocument, contentSelector }) {
  const contentElements = [...htmlDocument.querySelectorAll(contentSelector)];
  const images = contentElements.flatMap((element) =>
    element.tagName.toLowerCase() === "img"
      ? [element]
      : [...element.querySelectorAll("img")],
  );

  if (images.length === 0) {
    return {
      score: 9,
      translation: "na",
    };
  }

  const imagesWithoutAltAttribute = images.filter(
    (image) => image.getAttribute("alt") === null,
  );
  const imagesWithoutAltAttributeCount = imagesWithoutAltAttribute.length;

  return {
    score:
      imagesWithoutAltAttributeCount === images.length
        ? 3
        : imagesWithoutAltAttributeCount > 0
          ? 3
          : 9,
    translation:
      imagesWithoutAltAttributeCount === images.length
        ? // None of the images have an alt attribute
          "none"
        : imagesWithoutAltAttributeCount > 0
          ? // Not all images have an alt attribute
            "some"
          : // All images have an alt attribute
            "every",
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
export function headingStructureOrder({ htmlDocument, contentSelector }) {
  const contentElements = [...htmlDocument.querySelectorAll(contentSelector)];
  const headings = contentElements.flatMap((element) =>
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(element.tagName.toLowerCase())
      ? [element]
      : [...element.querySelectorAll("h1, h2, h3, h4, h5, h6")],
  );

  let previousLevel = 0;
  const issues = [];

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
              // eslint-disable-next-line unicorn/prefer-dom-node-text-content
              `<li><strong>${heading.tagName}</strong>: ${heading.innerText}</li>`,
          )
          .join("")}</ul>`,
      },
    }),
  };
}
