const fs = require("fs");
const path = require("path");
const { parseAnnotations } = require("./tj-annotations");

const HEADER_START = "// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐";
const HEADER_END   = "// └──────────────────────────────────────────────────────────────────┘";

function buildHeaderBlock(fileName, records) {
  const rows = records.filter(r => r.hasAnnotation).map(r =>
    `//   ${r.name.padEnd(32)} ${(r.tjType.join(", ") || "-").padEnd(20)} → ${r.tjBlock}`);
  return [HEADER_START, `// ${fileName}`, ...rows, HEADER_END].join("\n");
}

function buildMappingIndex(fileToRecords) {
  const lines = ["# type-helper-index (AUTO-GENERATED — do not edit)", "",
    "| config type | helper | file | block | usage |", "|---|---|---|---|---|"];
  for (const [file, recs] of Object.entries(fileToRecords))
    for (const r of recs.filter(x => x.hasAnnotation))
      for (const t of (r.tjType.length ? r.tjType : ["-"]))
        lines.push(`| ${t} | \`${r.name}\` | ${file} | ${r.tjBlock} | \`${r.tjUsage}\` |`);
  return lines.join("\n") + "\n";
}

function rewriteHeader(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const recs = parseAnnotations(src);
  const header = buildHeaderBlock(path.basename(filePath), recs);
  const lines = src.split("\n");
  const s = lines.findIndex(l => l.includes("AUTO-GENERATED from @tj"));
  const e = lines.findIndex(l => l.startsWith(HEADER_END));
  const body = (s !== -1 && e !== -1) ? [...lines.slice(0, s - 1), ...lines.slice(e + 1)].join("\n") : src;
  fs.writeFileSync(filePath, header + "\n" + body.replace(/^\n+/, ""));
  return recs;
}

if (require.main === module) {
  const base = path.join(__dirname, "../../cypress/support/utils");
  const files = ["commonWidget.js", "events.js", "editor/textInput.js", "inspector.js"].map(f => path.join(base, f));
  const map = {};
  for (const f of files) map[path.relative(base, f)] = rewriteHeader(f);
  const out = path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md");
  fs.writeFileSync(out, buildMappingIndex(map));
  console.log("generated headers + type-helper-index.md");
}

module.exports = { buildHeaderBlock, buildMappingIndex, rewriteHeader };
