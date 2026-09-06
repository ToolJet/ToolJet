const fs = require("fs");

const EXPORT_RE = /export\s+(?:const|function)\s+([A-Za-z0-9_]+)/;
const TAG_RE = { type: /@tjType\s+(.+)/, block: /@tjBlock\s+(\S+)/, usage: /@tjUsage\s+(.+)/, dom: /@tjDom\s+(.+)/ };
// @tjBlock = "which family does this helper belong to".
//   app-builder: a UI region every widget shares (properties / styles / events / …).
//   platform:    a product area, mirroring cypress/e2e/happyPath/platform/<area>/.
// `common` is shared by both — cross-domain helpers with no single owner.
const APPBUILDER_BLOCKS = ["properties","styles","events","csa","inspector","canvas","contexts"];
const PLATFORM_BLOCKS = ["onboarding","access","apps","licensing","workspace","superAdmin","externalApi","gitSync","modules"];
const VALID_BLOCKS = [...APPBUILDER_BLOCKS, ...PLATFORM_BLOCKS, "common"];

function parseAnnotations(src) {
  const lines = src.split("\n");
  const recs = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(EXPORT_RE);
    if (!m) continue;
    // look back up to 12 lines for a JSDoc block ending just above
    let block = "";
    for (let j = i - 1; j >= 0 && j >= i - 12; j--) {
      block = lines[j] + "\n" + block;
      if (lines[j].trim().startsWith("/**")) break;
      if (lines[j].trim() === "" && !block.includes("*/")) { block = ""; break; }
    }
    const has = block.includes("@tj");
    const grab = (re) => {
      let val = (block.match(re)?.[1] || "").trim();
      // Strip at the first @ (next tag) or */ (JSDoc close)
      val = val.replace(/\s*[@*].*$/, "").trim();
      return val;
    };
    recs.push({
      name: m[1], line: i + 1, hasAnnotation: has,
      tjType: grab(TAG_RE.type) ? grab(TAG_RE.type).split(",").map(s => s.trim()) : [],
      tjBlock: grab(TAG_RE.block), tjUsage: grab(TAG_RE.usage), tjDom: grab(TAG_RE.dom),
    });
  }
  return recs;
}

function lintFile(filePath) {
  const recs = parseAnnotations(fs.readFileSync(filePath, "utf8"));
  const violations = [];
  for (const r of recs) {
    if (!r.hasAnnotation) { violations.push({ name: r.name, line: r.line, reason: "missing @tj annotation" }); continue; }
    if (!r.tjBlock || !VALID_BLOCKS.includes(r.tjBlock))
      violations.push({ name: r.name, line: r.line, reason: `invalid @tjBlock '${r.tjBlock}'` });
    if (!r.tjUsage) violations.push({ name: r.name, line: r.line, reason: "missing @tjUsage" });
  }
  return { path: filePath, violations };
}

// ── command layer ────────────────────────────────────────────────────────────
// Commands are declared with Cypress.Commands.add("name", …) rather than `export
// const`, and carry a single @tjCmd tag holding "<category> · <when to use it>"
// (see cypress/commands/appbuilder/command-creation-criteria.md).
// Scanned against the whole source, not line by line: many declarations wrap, e.g.
//   Cypress.Commands.add(
//     "apiLogin",
// so the name sits on the line after `add(`.
const COMMAND_RE_G = /Cypress\.Commands\.(?:add|overwrite)\(\s*["']([A-Za-z0-9_]+)["']/g;
const VALID_CMD_CATEGORIES = [
  "auth", "app-crud", "app-setup", "api", "canvas", "editor",
  "interaction", "assertion", "codemirror", "wait", "env",
  // platform additions
  "workspace", "user", "group", "license", "gitsync", "sso",
];

function parseCommandAnnotations(src) {
  const lines = src.split("\n");
  const recs = [];
  COMMAND_RE_G.lastIndex = 0;
  let m;
  while ((m = COMMAND_RE_G.exec(src)) !== null) {
    // line index of the `Cypress.Commands.add(` that opened this declaration
    const i = src.slice(0, m.index).split("\n").length - 1;
    let block = "";
    for (let j = i - 1; j >= 0 && j >= i - 12; j--) {
      block = lines[j] + "\n" + block;
      if (lines[j].trim().startsWith("/**")) break;
      if (lines[j].trim() === "" && !block.includes("*/")) { block = ""; break; }
    }
    const cmd = (block.match(/@tjCmd\s+(.+)/)?.[1] || "").replace(/\s*\*\/.*$/, "").trim();
    const [category, ...rest] = cmd.split("·").map((s) => s.trim());
    recs.push({
      name: m[1], line: i + 1, hasAnnotation: block.includes("@tjCmd"),
      category: category || "",
      description: rest.join(" · "),
      tjUsage: (block.match(/@tjUsage\s+(.+)/)?.[1] || "").replace(/\s*[@*].*$/, "").trim(),
    });
  }
  return recs;
}

function lintCommandFile(filePath) {
  const recs = parseCommandAnnotations(fs.readFileSync(filePath, "utf8"));
  const violations = [];
  for (const r of recs) {
    if (!r.hasAnnotation) { violations.push({ name: r.name, line: r.line, reason: "missing @tjCmd annotation" }); continue; }
    if (!VALID_CMD_CATEGORIES.includes(r.category))
      violations.push({ name: r.name, line: r.line, reason: `invalid @tjCmd category '${r.category}'` });
    if (!r.description) violations.push({ name: r.name, line: r.line, reason: "@tjCmd missing the '· when to use it' half" });
    if (!r.tjUsage) violations.push({ name: r.name, line: r.line, reason: "missing @tjUsage" });
  }
  return { path: filePath, violations };
}

module.exports = {
  parseAnnotations, lintFile, VALID_BLOCKS, APPBUILDER_BLOCKS, PLATFORM_BLOCKS,
  parseCommandAnnotations, lintCommandFile, VALID_CMD_CATEGORIES,
};
