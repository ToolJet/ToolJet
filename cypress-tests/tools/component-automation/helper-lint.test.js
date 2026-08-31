// helper-lint.test.js
const assert = require("assert");
const { parseAnnotations, lintFile } = require("./tj-annotations");
const path = require("path");

const good = path.join(__dirname, "__fixtures__/good.helper.js");
const bad = path.join(__dirname, "__fixtures__/bad.helper.js");

// good.helper.js: one annotated export → no violations
assert.deepStrictEqual(lintFile(good).violations, [], "good fixture must lint clean");

// bad.helper.js: one exported helper with NO annotation → exactly one violation
const v = lintFile(bad).violations;
assert.strictEqual(v.length, 1, "bad fixture must have 1 violation");
assert.strictEqual(v[0].name, "unannotatedHelper");
assert.match(v[0].reason, /missing @tj annotation/);

// parser extracts the tag values
const rec = parseAnnotations(require("fs").readFileSync(good, "utf8")).find(r => r.name === "annotatedHelper");
assert.deepStrictEqual(rec.tjType, ["toggle", "switch"]);
assert.strictEqual(rec.tjBlock, "properties");
console.log("helper-lint.test PASS");
