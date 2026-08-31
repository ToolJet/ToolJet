const assert = require("assert");
const { buildHeaderBlock, buildMappingIndex, rewriteHeader } = require("./generate-helper-docs");
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

console.log("generate-helper-docs.test PASS");
