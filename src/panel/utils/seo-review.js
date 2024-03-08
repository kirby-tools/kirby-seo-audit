/* eslint-disable unicorn/prefer-dom-node-text-content */
import { langCultureMap } from "../constants";

export async function prepareRemoteData({
  html,
  contentSelector = "body",
} = {}) {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");

  // Remove all script tags
  for (const script of Array.from(
    htmlDocument.body.querySelectorAll("script"),
  )) {
    script.remove();
  }

  // Find the language and culture
  let langCulture = htmlDocument.documentElement.lang ?? langCultureMap.en;
  if (!langCulture.includes("-")) {
    langCulture =
      langCultureMap?.[langCulture.toLowerCase()] ?? langCultureMap.en;
  }

  // Extract the title, description and content
  const title =
    htmlDocument.title ||
    htmlDocument.querySelector("h1")?.innerText ||
    htmlDocument.querySelector("h2")?.innerText ||
    "";
  const description =
    htmlDocument.querySelector('meta[name="description"]')?.content || "";
  const content = htmlDocument.querySelector(contentSelector)?.innerHTML || "";

  return {
    locale: langCulture,
    title,
    description,
    content,
  };
}
