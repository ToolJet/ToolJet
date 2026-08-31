const assert = require("assert");
const fs = require("fs"); const path = require("path");
const { parseIndex } = require("./helper-for");
const { lintSpecHelpers } = require("./spec-helpers-lint");
const idx = parseIndex(fs.readFileSync(path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md"), "utf8"));

const good = path.join(__dirname, "__fixtures__/good.spec.js");
const bad = path.join(__dirname, "__fixtures__/bad.spec.js");
assert.deepStrictEqual(lintSpecHelpers(good, idx).violations, [], "good spec: all helpers in index");
const v = lintSpecHelpers(bad, idx).violations;
assert(v.some(x => x.helper === "totallyMadeUpHelper"), "must flag the invented helper");
console.log("spec-helpers-lint.test PASS");
