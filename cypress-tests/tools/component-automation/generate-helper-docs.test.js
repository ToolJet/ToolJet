const assert = require("assert");
const { buildHeaderBlock, buildMappingIndex, rewriteHeader, checkSync, escapeMdCell } = require("./generate-helper-docs");
const { parseAnnotations } = require("./tj-annotations");
const fs = require("fs");
const os = require("os");
const path = require("path");

const recs = parseAnnotations(fs.readFileSync(path.join(__dirname, "__fixtures__/good.helper.js"), "utf8"));
const header = buildHeaderBlock("good.helper.js", recs);
assert.match(header, /AUTO-GENERATED from @tj annotations/);
assert.match(header, /annotatedHelper/);
assert.match(header, /toggle, switch/);

const idx = buildMappingIndex({ "commonWidget.js": recs });
assert.match(idx, /\| toggle \|/);            // type row present
assert.match(idx, /annotatedHelper/);         // helper named
assert.match(idx, /commonWidget\.js/);        // file named

// --- rewriteHeader round-trip + idempotency test ---
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tj-gen-helper-test-"));
  const tmpFile = path.join(tmpDir, "tmp.helper.js");

  // Small annotated helper — the body that must survive rewrites
  const originalBody = [
    "/**",
    " * @tjType  toggle",
    " * @tjBlock properties",
    " * @tjUsage tmpHelper('Label', '{{true}}')",
    " * @tjDom   some dom note",
    " */",
    "export const tmpHelper = (label, value) => {};",
  ].join("\n") + "\n";

  fs.writeFileSync(tmpFile, originalBody);

  // First run: header is prepended
  rewriteHeader(tmpFile);
  const afterFirst = fs.readFileSync(tmpFile, "utf8");
  assert.match(afterFirst, /AUTO-GENERATED from @tj annotations/, "first run: header present");
  assert.match(afterFirst, /tmpHelper/, "first run: helper name in header");
  assert.match(afterFirst, /export const tmpHelper/, "first run: body content preserved");

  // Second run: must be byte-identical (idempotent)
  rewriteHeader(tmpFile);
  const afterSecond = fs.readFileSync(tmpFile, "utf8");
  assert.strictEqual(afterSecond, afterFirst, "second run: output is byte-identical (idempotent)");

  // Third run for extra confidence
  rewriteHeader(tmpFile);
  const afterThird = fs.readFileSync(tmpFile, "utf8");
  assert.strictEqual(afterThird, afterFirst, "third run: still byte-identical");

  // Confirm no body lines were lost
  assert.match(afterFirst, /export const tmpHelper = \(label, value\) => {};/, "body line exact match");

  // Clean up
  fs.unlinkSync(tmpFile);
  fs.rmdirSync(tmpDir);
}

// --- escapeMdCell: pipe characters are escaped, newlines collapsed ---
{
  assert.strictEqual(escapeMdCell("foo|bar"), "foo\\|bar", "pipe escaped");
  assert.strictEqual(escapeMdCell("line1\nline2"), "line1 line2", "newline collapsed");
  assert.strictEqual(escapeMdCell("  trimmed  "), "trimmed", "leading/trailing spaces trimmed");
}

// --- buildMappingIndex: cell with | in @tjUsage stays as one valid 5-column row ---
{
  const pipeRec = parseAnnotations([
    "/**",
    " * @tjType  toggle",
    " * @tjBlock properties",
    " * @tjUsage pipeHelper('a|b', 'x|y')",
    " * @tjDom   some dom note",
    " */",
    "export const pipeHelper = (a, b) => {};",
  ].join("\n"));
  const idx = buildMappingIndex({ "test.js": pipeRec });
  // Every data row must have exactly 5 cells (6 pipe chars per row incl. leading/trailing)
  const rows = idx.split("\n").filter(l => l.startsWith("| ") && !l.startsWith("| config"));
  assert.ok(rows.length > 0, "at least one data row");
  for (const row of rows) {
    const cols = row.split(/(?<!\\)\|/);
    assert.strictEqual(cols.length, 7, `row must have 5 columns (7 splits): ${row}`);
  }
  // The escaped pipe must appear in the usage cell
  assert.ok(idx.includes("\\|"), "escaped pipe present in index");
}

// --- checkSync: detect drift when annotation changes but header not regenerated ---
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tj-checksync-test-"));
  const tmpFile = path.join(tmpDir, "drift.helper.js");
  const tmpBase = tmpDir;
  const tmpIndex = path.join(tmpDir, "type-helper-index.md");

  const body = [
    "/**",
    " * @tjType  toggle",
    " * @tjBlock properties",
    " * @tjUsage driftHelper('Label', '{{true}}')",
    " * @tjDom   some dom note",
    " */",
    "export const driftHelper = (label, value) => {};",
  ].join("\n") + "\n";

  fs.writeFileSync(tmpFile, body);

  // Generate header + index
  rewriteHeader(tmpFile);
  const recs = parseAnnotations(fs.readFileSync(tmpFile, "utf8"));
  fs.writeFileSync(tmpIndex, buildMappingIndex({ "drift.helper.js": recs }));

  // Should be fresh now
  const stale1 = checkSync([tmpFile], tmpBase, tmpIndex);
  assert.deepStrictEqual(stale1, [], "after generate: must be fresh");

  // Mutate the annotation WITHOUT regenerating
  const current = fs.readFileSync(tmpFile, "utf8");
  const mutated = current.replace("@tjType  toggle", "@tjType  switch");
  fs.writeFileSync(tmpFile, mutated);

  // Should now detect drift
  const stale2 = checkSync([tmpFile], tmpBase, tmpIndex);
  assert.ok(stale2.length > 0, "after mutation without regen: must report stale");

  // Regenerate and confirm fresh again
  rewriteHeader(tmpFile);
  const recs2 = parseAnnotations(fs.readFileSync(tmpFile, "utf8"));
  fs.writeFileSync(tmpIndex, buildMappingIndex({ "drift.helper.js": recs2 }));
  const stale3 = checkSync([tmpFile], tmpBase, tmpIndex);
  assert.deepStrictEqual(stale3, [], "after re-generate: must be fresh again");

  // Clean up
  fs.unlinkSync(tmpFile);
  fs.unlinkSync(tmpIndex);
  fs.rmdirSync(tmpDir);
}

console.log("generate-helper-docs.test PASS");
