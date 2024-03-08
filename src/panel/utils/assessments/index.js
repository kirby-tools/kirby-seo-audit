/**
 * The single H1 assessment checks whether there is only one H1 on the page.
 */
export function singleH1({ contentDocument }) {
  const h1s = Array.from(contentDocument.querySelectorAll("h1"));
  const hasSingleH1 = h1s.length === 1;

  return {
    score: hasSingleH1 ? 9 : 3,
    translation: "singleH1",
  };
}

/**
 * The alt text assessment checks whether all images have alt text.
 */
export function altText({ contentDocument }) {
  const images = Array.from(contentDocument.querySelectorAll("img"));
  const imagesWithoutAltText = images.filter((image) => !image.alt);

  return {
    score:
      // None of the images have alt text
      imagesWithoutAltText.length === images.length
        ? 3
        : // Not all images have alt text
          imagesWithoutAltText.length > 0
          ? 3
          : // All images have alt text
            9,
    translation:
      imagesWithoutAltText.length === images.length
        ? "altText.allImagesWithoutAltText"
        : imagesWithoutAltText.length > 0
          ? "altText.someImagesHaveAltText"
          : "altText.allImagesHaveAltText",
  };
}
