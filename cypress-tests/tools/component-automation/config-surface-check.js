// config-surface-check.js — lightweight structural validator for the config-reader's YAML
function assertSurfaceShape(yamlText) {
  const missing = [];
  if (!/^\s*runtimeCandidate:\s*\S+/m.test(yamlText)) missing.push("runtimeCandidate");
  // Track which section we're in: properties, styles, or other.
  // This inFxSection flag drives which fields are required (properties need section+conditionallyRender,
  // styles need conditionallyRender only, others need neither).
  const lines = yamlText.split("\n");
  let inPropertiesSection = false; // true when inside properties: section
  let inStylesSection = false;     // true when inside styles: section
  for (let i = 0; i < lines.length; i++) {
    // Track section entry points
    if (/^\s*properties:\s*$/.test(lines[i])) { inPropertiesSection = true; inStylesSection = false; continue; }
    if (/^\s*styles:\s*$/.test(lines[i])) { inPropertiesSection = false; inStylesSection = true; continue; }
    if (/^\s*(events|others|csa|exposed_variables|defaults|nested_variants):\s*/.test(lines[i])) { inPropertiesSection = false; inStylesSection = false; continue; }

    if ((inPropertiesSection || inStylesSection) && /^\s*-\s*name:\s*\S+/.test(lines[i])) {
      const entryName = lines[i].trim();
      let hasFxCapable = false;
      let hasSection = false;
      let hasConditionallyRender = false;

      // Scan ahead to find entry's properties (before next "- name:" or section header)
      for (let j = i + 1; j < lines.length && !/^\s*-\s*name:/.test(lines[j]); j++) {
        if (/^\s*(properties|styles|events|others|csa):/.test(lines[j])) break;
        if (/^\s*fxCapable:\s*(true|false)/.test(lines[j])) { hasFxCapable = true; }
        if (/^\s*section:\s*\S+/.test(lines[j])) { hasSection = true; }
        if (/^\s*conditionallyRender:/.test(lines[j])) { hasConditionallyRender = true; }
      }

      if (!hasFxCapable) missing.push(`fxCapable@${entryName}`);
      if (inPropertiesSection && !hasSection) missing.push(`section@${entryName}`);
      if ((inPropertiesSection || inStylesSection) && !hasConditionallyRender) missing.push(`conditionallyRender@${entryName}`);
    }
  }
  return { ok: missing.length === 0, missing };
}
module.exports = { assertSurfaceShape };
