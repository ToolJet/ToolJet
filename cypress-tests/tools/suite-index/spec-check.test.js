const assert = require("assert");
const { checkChange, checkAll, scopeCheck, exposureCheck } = require("./spec-check");

const tagged = (name, body = "") => `/**\n * @tjType   a.b\n * @tjBlock  shared\n * @tjUsage  ${name}()\n */\nexport const ${name} = () => {${body}};\n`;
const ctx = (o = {}) => ({ exportsOf: () => new Set(["real"]), existingNames: new Set(), ...o });
const rules = (r) => r.map(x => x.rule).sort();

// import must exist, but only for imports this change added
const specBefore = 'import { old } from "Support/utils/x";\nit("a", () => {});\n';
const specAfter = 'import { old, real, ghost } from "Support/utils/x";\nit("a", () => {});\n';
let r = checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: specBefore, after: specAfter, ...ctx() });
assert.deepStrictEqual(rules(r), ["import"]);
assert.match(r[0].message, /ghost/);
assert.deepStrictEqual(checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: specBefore, after: specBefore, ...ctx({ exportsOf: () => new Set() }) }), [], "unchanged import is not rechecked");
assert.deepStrictEqual(checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: "", after: 'import { a } from "Support/utils/none";\n', ...ctx({ exportsOf: () => null }) }), [], "unresolvable file skipped");

// a new exported helper needs all three tags and a unique name
const helperFile = "cypress-tests/cypress/support/utils/h.js";
r = checkChange({ file: helperFile, before: "", after: "export const fresh = () => {};\n", ...ctx() });
assert.deepStrictEqual(rules(r), ["untagged"]);
assert.deepStrictEqual(checkChange({ file: helperFile, before: "", after: tagged("fresh"), ...ctx() }), []);
r = checkChange({ file: helperFile, before: "", after: tagged("taken"), ...ctx({ existingNames: new Set(["taken"]) }) });
assert.deepStrictEqual(rules(r), ["dup-name"]);
assert.deepStrictEqual(checkChange({ file: helperFile, before: tagged("kept"), after: tagged("kept", " /* c */ "), ...ctx({ existingNames: new Set(["kept"]) }) }), [], "edit of an existing helper is not new");
r = checkChange({ file: "cypress-tests/cypress/commands/c.js", before: "", after: 'Cypress.Commands.add("newCmd", () => {});\n', ...ctx() });
assert.deepStrictEqual(rules(r), ["untagged"]);

// banned lines are counted against the previous version
const noisy = 'it("a", () => { cy.wait(500); });\n';
r = checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: noisy, after: noisy + 'it.only("b", () => { cy.wait(1000); });\n', ...ctx() });
assert.deepStrictEqual(rules(r), ["banned", "banned"]);
assert.deepStrictEqual(checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: noisy, after: noisy, ...ctx() }), [], "existing wait is not new");
assert.deepStrictEqual(checkChange({ file: "cypress-tests/cypress/e2e/s.cy.js", before: "", after: 'cy.wait("@alias");\n', ...ctx() }), [], "alias wait is fine");

// it() count is checked across all changed files, so a moved test is not a drop
const f1 = { file: "cypress-tests/cypress/e2e/a.cy.js", before: 'it("x", () => {});\nit("y", () => {});\n', after: 'it("x", () => {});\n' };
const f2 = { file: "cypress-tests/cypress/e2e/b.cy.js", before: "", after: 'it("y", () => {});\n' };
assert.deepStrictEqual(checkAll([f1, f2], ctx()), [], "moved it() is not a drop");
assert.deepStrictEqual(rules(checkAll([f1], ctx())), ["it-count"]);
assert.deepStrictEqual(rules(checkAll([{ file: f1.file, before: f1.before, after: f1.before.replace('it("y"', 'it.skip("y"') }], ctx())), ["it-count"]);
assert.deepStrictEqual(checkAll([{ file: f1.file, before: f1.before, after: f1.before.replace('"x"', '"renamed"') }], ctx()), [], "rename only");
assert.deepStrictEqual(checkAll([{ file: "cypress-tests/cypress/support/utils/h.js", before: "// a\n", after: "// b\n" }], ctx()), [], "comment-only change");

// scope and exposure
assert.deepStrictEqual(scopeCheck(["cypress-tests/a.js", "server/b.js", "frontend/c.js"]).map(x => x.file), ["server/b.js", "frontend/c.js"]);
assert.deepStrictEqual(rules(exposureCheck("a.js", `const k = "ghp_${"a".repeat(30)}";\n`)), ["exposure"]);
assert.deepStrictEqual(exposureCheck("a.js", 'const p = "password"; const t = `sk-ant-${Date.now()}`;\n'), [], "public placeholders");
console.log("spec-check.test PASS");
