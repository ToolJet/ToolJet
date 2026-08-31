const assert = require("assert");
const fs = require("fs"); const path = require("path");
const { parseIndex } = require("./helper-for");
const { lintSpecHelpers } = require("./spec-helpers-lint");
const idx = parseIndex(fs.readFileSync(path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md"), "utf8"));

const good = path.join(__dirname, "__fixtures__/good.spec.js");
const bad = path.join(__dirname, "__fixtures__/bad.spec.js");
const goodWithAlias = path.join(__dirname, "__fixtures__/good-with-alias.spec.js");
const badWithAlias = path.join(__dirname, "__fixtures__/bad-with-alias.spec.js");

assert.deepStrictEqual(lintSpecHelpers(good, idx).violations, [], "good spec: all helpers in index");
const v = lintSpecHelpers(bad, idx).violations;
assert(v.some(x => x.helper === "totallyMadeUpHelper"), "must flag the invented helper");

// Test aliased imports: real helpers with aliases should NOT be flagged
assert.deepStrictEqual(lintSpecHelpers(goodWithAlias, idx).violations, [], "aliased spec: all original helper names in index");

// Test aliased imports: made-up helpers with aliases should be flagged by their ORIGINAL name
const vAlias = lintSpecHelpers(badWithAlias, idx).violations;
assert(vAlias.some(x => x.helper === "totallyMadeUpHelper"), "must flag the invented helper by original name (before 'as')");
assert(!vAlias.some(x => x.helper === "madeUp"), "must NOT flag the alias name");

console.log("spec-helpers-lint.test PASS");
