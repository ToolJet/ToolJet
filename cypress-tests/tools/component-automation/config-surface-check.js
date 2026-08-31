// config-surface-check.js — lightweight structural validator for the config-reader's YAML
function assertSurfaceShape(yamlText) {
  const missing = [];
  if (!/^\s*runtimeCandidate:\s*\S+/m.test(yamlText)) missing.push("runtimeCandidate");
  // every property/style list item (a line starting "- name:") must be followed,
  // within its block, by an fxCapable: line before the next "- name:" or dedent.
  // Only entries under `properties:` and `styles:` sections require fxCapable.
  const lines = yamlText.split("\n");
  let inFxSection = false; // true when inside properties: or styles: section
  for (let i = 0; i < lines.length; i++) {
    // Track which section we're in (properties/styles require fxCapable; events/others/csa/exposed_variables do not)
    if (/^\s*(properties|styles):\s*$/.test(lines[i])) { inFxSection = true; continue; }
    if (/^\s*(events|others|csa|exposed_variables|defaults|nested_variants):\s*/.test(lines[i])) { inFxSection = false; continue; }
    if (inFxSection && /^\s*-\s*name:\s*\S+/.test(lines[i])) {
      let hasFx = false;
      for (let j = i + 1; j < lines.length && !/^\s*-\s*name:/.test(lines[j]); j++) {
        if (/^\s*fxCapable:\s*(true|false)/.test(lines[j])) { hasFx = true; break; }
        if (/^\s*(properties|styles|events|others|csa):/.test(lines[j])) break;
      }
      if (!hasFx) missing.push(`fxCapable@${lines[i].trim()}`);
    }
  }
  return { ok: missing.length === 0, missing };
}
module.exports = { assertSurfaceShape };
