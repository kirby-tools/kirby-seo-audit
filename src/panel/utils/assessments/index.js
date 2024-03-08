/**
 * The alt text assessment checks whether all images have alt text.
 */
export function altText(contentDocument) {
  const images = Array.from(contentDocument.querySelectorAll("img"));
  const imagesWithoutAltText = images.filter((image) => !image.alt);

  return {
    score:
      imagesWithoutAltText.length === images.length
        ? 3
        : imagesWithoutAltText.length > 0
          ? 3
          : 9,
    translation:
      imagesWithoutAltText.length === images.length
        ? // None of the images have alt text
          "altText.none"
        : imagesWithoutAltText.length > 0
          ? // Not all images have alt text
            "altText.some"
          : // All images have alt text
            "altText.every",
  };
}
