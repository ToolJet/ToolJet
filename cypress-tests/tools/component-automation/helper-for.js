// helper-for.js
const COMPOSITE_HELPERS = ["verifyLayout", "verifyStylesGeneralAccordion", "verifyPropertiesGeneralAccordion"];
const SELECT_BEFORE_VERIFY = { selectColourFromColourPicker: 0, verifyWidgetColorCss: 1, fillBoxShadowParams: 0, verifyBoxShadowCss: 1 };

function parseIndex(md) {
  return md.split("\n")
    .filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("config type"))
    .map(l => l.split("|").slice(1, -1).map(c => c.trim().replace(/^`|`$/g, "")))
    .filter(c => c.length >= 5)
    .map(([type, helper, file, block, usage]) => ({ type, helper, file, block, usage }));
}

function helperFor(type, block, rows) {
  const matches = rows.filter(r => r.type === type && r.block === block && !COMPOSITE_HELPERS.includes(r.helper));
  if (!matches.length) return null;
  if (matches.length === 1) return { helper: matches[0].helper, usage: matches[0].usage };
  const ordered = matches.slice().sort((a, b) =>
    (SELECT_BEFORE_VERIFY[a.helper] ?? 9) - (SELECT_BEFORE_VERIFY[b.helper] ?? 9));
  return { helpers: ordered.map(m => ({ helper: m.helper, usage: m.usage })) };
}
module.exports = { parseIndex, helperFor, COMPOSITE_HELPERS };
