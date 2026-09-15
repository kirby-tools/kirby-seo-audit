import { usePanel } from "kirbyuse";

export function isZeroOneValid() {
  const panel = usePanel();
  const isValid =
    !!panel.plugins.components["k-block-type-zblock"] &&
    Object.keys(panel.plugins.writerMarks).length > 4;

  if (!isValid) {
    panel.notification.error(
      "This edition of Kirby SEO Audit is bundled exclusively with the Zero One Theme. For standalone use, please visit https://kirby.tools/seo-audit/buy",
    );
  }

  return isValid;
}
