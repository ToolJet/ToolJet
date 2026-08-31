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

/** Escape a Markdown table cell value: replace | with \| and collapse newlines. */
function escapeMdCell(val) {
  return val.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").trim();
}

function buildMappingIndex(fileToRecords) {
  const lines = ["# type-helper-index (AUTO-GENERATED — do not edit)", "",
    "| config type | helper | file | block | usage |", "|---|---|---|---|---|"];
  for (const [file, recs] of Object.entries(fileToRecords))
    for (const r of recs.filter(x => x.hasAnnotation))
      for (const t of (r.tjType.length ? r.tjType : ["-"]))
        lines.push(`| ${escapeMdCell(t)} | \`${escapeMdCell(r.name)}\` | ${escapeMdCell(file)} | ${escapeMdCell(r.tjBlock)} | \`${escapeMdCell(r.tjUsage)}\` |`);
  return lines.join("\n") + "\n";
}

function rewriteHeader(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const recs = parseAnnotations(src);
  const header = buildHeaderBlock(path.basename(filePath), recs);
  const lines = src.split("\n");
  const s = lines.findIndex(l => l.includes("AUTO-GENERATED from @tj"));
  const e = lines.findIndex(l => l.startsWith(HEADER_END));
  let bodyLines;
  if (s !== -1 && e !== -1 && e >= s) {
    let after = e + 1;
    if (lines[after] === "") after += 1;               // absorb one blank line after old header
    bodyLines = [...lines.slice(0, s), ...lines.slice(after)];
  } else {
    bodyLines = lines;
  }
  const body = bodyLines.join("\n").replace(/^\n+/, "");
  fs.writeFileSync(filePath, header + "\n" + body);
  return recs;
}

/**
 * Regenerate each file's header block and the index IN MEMORY; compare to disk.
 * Returns an array of stale artifact descriptions (empty = all fresh).
 *
 * @param {string[]} filePaths  - absolute paths to the annotated helper files
 * @param {string}   base       - path prefix to strip for relative file keys
 * @param {string}   indexPath  - absolute path to type-helper-index.md
 */
function checkSync(filePaths, base, indexPath) {
  const stale = [];
  const map = {};
  for (const f of filePaths) {
    const src = fs.readFileSync(f, "utf8");
    const recs = parseAnnotations(src);
    const header = buildHeaderBlock(path.basename(f), recs);
    // Compute what the file SHOULD look like after a rewrite
    const lines = src.split("\n");
    const s = lines.findIndex(l => l.includes("AUTO-GENERATED from @tj"));
    const e = lines.findIndex(l => l.startsWith(HEADER_END));
    let bodyLines;
    if (s !== -1 && e !== -1 && e >= s) {
      let after = e + 1;
      if (lines[after] === "") after += 1;
      bodyLines = [...lines.slice(0, s), ...lines.slice(after)];
    } else {
      bodyLines = lines;
    }
    const body = bodyLines.join("\n").replace(/^\n+/, "");
    const expected = header + "\n" + body;
    if (src !== expected) stale.push(path.relative(base, f) + " (header block)");
    map[path.relative(base, f)] = recs;
  }
  // Check index
  const expectedIndex = buildMappingIndex(map);
  const actualIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  if (actualIndex !== expectedIndex) stale.push("type-helper-index.md");
  return stale;
}

if (require.main === module) {
  const base = path.join(__dirname, "../../cypress/support/utils");
  const files = ["commonWidget.js", "events.js", "editor/textInput.js", "inspector.js"].map(f => path.join(base, f));
  const out = path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md");

  if (process.argv.includes("--check")) {
    const stale = checkSync(files, base, out);
    if (stale.length === 0) {
      console.log("generate-helper-docs --check: all fresh");
      process.exit(0);
    } else {
      console.error("generate-helper-docs --check: stale artifacts detected:");
      stale.forEach(s => console.error("  " + s));
      console.error("Re-run: node tools/component-automation/generate-helper-docs.js");
      process.exit(1);
    }
  }

  const map = {};
  for (const f of files) map[path.relative(base, f)] = rewriteHeader(f);
  fs.writeFileSync(out, buildMappingIndex(map));
  console.log("generated headers + type-helper-index.md");
}

module.exports = { buildHeaderBlock, buildMappingIndex, rewriteHeader, checkSync, escapeMdCell };
