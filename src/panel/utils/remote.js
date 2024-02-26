import { langCultureMap } from "../constants";

export async function prepareRemoteData({
  html,
  contentSelector = "body",
} = {}) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove all script tags
  for (const script of Array.from(doc.body.querySelectorAll("script"))) {
    script.remove();
  }

  // Find the language and culture
  let langCulture = doc.documentElement.lang ?? langCultureMap.en;
  if (!langCulture.includes("-")) {
    langCulture =
      langCultureMap?.[langCulture.toLowerCase()] ?? langCultureMap.en;
  }

  // Find the title, description and content
  const title =
    doc.title ||
    doc.querySelector("h1")?.textContent ||
    doc.querySelector("h2")?.textContent ||
    "";
  const description =
    doc.querySelector('meta[name="description"]')?.content || "";
  const content = doc.querySelector(contentSelector)?.innerHTML || "";

  return {
    locale: langCulture,
    title,
    description,
    content,
  };
}
