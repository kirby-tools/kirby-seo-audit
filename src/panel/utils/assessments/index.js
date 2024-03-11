/**
 * Checks whether the content contains a H1 heading.
 */
export function singleH1({ htmlDocument, contentSelector }) {
  const h1s = queryAllWithin(`${contentSelector} h1`, htmlDocument);

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
  const images = queryAllWithin(`${contentSelector} img`, htmlDocument);
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
  const headings = queryAllWithin(
    `${contentSelector} h1, ${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4, ${contentSelector} h5, ${contentSelector} h6`,
    htmlDocument,
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
        text: `<ul>${issues.map(
          (heading) =>
            // eslint-disable-next-line unicorn/prefer-dom-node-text-content
            `<li><strong>${heading.tagName}</strong>: ${heading.innerText}</li>`,
        )}</ul>`,
      },
    }),
  };
}

function queryAllWithin(selector, context) {
  return Array.from(context.querySelectorAll(selector));
}
