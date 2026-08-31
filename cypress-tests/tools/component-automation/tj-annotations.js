const fs = require("fs");

const EXPORT_RE = /export\s+(?:const|function)\s+([A-Za-z0-9_]+)/;
const TAG_RE = { type: /@tjType\s+(.+)/, block: /@tjBlock\s+(\S+)/, usage: /@tjUsage\s+(.+)/, dom: /@tjDom\s+(.+)/ };
const VALID_BLOCKS = ["properties","styles","events","csa","inspector","canvas","contexts","common"];

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
    const grab = (re) => (block.match(re)?.[1] || "").trim();
    recs.push({
      name: m[1], line: i + 1, hasAnnotation: has,
      tjType: grab(TAG_RE.type) ? grab(TAG_RE.type).split(",").map(s => s.trim()) : [],
      tjBlock: grab(TAG_RE.block), tjUsage: grab(TAG_RE.usage), tjDom: grab(TAG_RE.dom),
    });
  }
  return recs;
}

function lintFile(path) {
  const recs = parseAnnotations(fs.readFileSync(path, "utf8"));
  const violations = [];
  for (const r of recs) {
    if (!r.hasAnnotation) { violations.push({ name: r.name, line: r.line, reason: "missing @tj annotation" }); continue; }
    if (!r.tjBlock || !VALID_BLOCKS.includes(r.tjBlock))
      violations.push({ name: r.name, line: r.line, reason: `invalid @tjBlock '${r.tjBlock}'` });
    if (!r.tjUsage) violations.push({ name: r.name, line: r.line, reason: "missing @tjUsage" });
  }
  return { path, violations };
}

module.exports = { parseAnnotations, lintFile, VALID_BLOCKS };
