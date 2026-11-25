const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { collectSymbols, renderOutputs, writeOutputs } = require("./generate");

function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suite-index-"));
  for (const [rel, src] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), src);
  }
  return root;
}

const fx = (f) => fs.readFileSync(path.join(__dirname, "__fixtures__", f), "utf8");
const root = tree({
  "cypress/commands/platform/gitSyncCommands.js": fx("commands.js"),
  "cypress/commands/platform/gitSyncAppCommands.js": fx("overwrite.js"),
  "cypress/commands/commands.js": 'Cypress.Commands.add("untaggedShared", () => {});\n',
  "cypress/support/utils/platform/a.js": "export const dupHelper = () => {};\n",
  "cypress/support/utils/platform/b.js": "export const dupHelper = () => {};\n",
  "cypress/constants/selectors/platform/one.js": "export const one = { cancelButton: '[data-cy=\"c1\"]', only: '[data-cy=\"o\"]' };\n",
  "cypress/constants/selectors/platform/two.js": "export const two = { cancelButtonX: '[data-cy=\"x\"]' };\n",
  "cypress/constants/selectors/common.js": "export const c = { saveIt: '[data-cy=\"s\"]' };\n",
  "cypress/constants/selectors/tooljetDatabase/t.js": "export const t = { saveIt: '[data-cy=\"s2\"]' };\n",
  "cypress/constants/selectors/appBuilder/u.js": "export const u = { saveIt: '[data-cy=\"s3\"]' };\n",
  "cypress/support/utils/commonWidget.js": "/**\n * @tjBlock common\n * @tjUsage legacyHelper()\n */\nexport const legacyHelper = () => {};\n",
  "cypress/support/suiteIndex/ignored.js": "export const shouldNotAppear = () => {};\n",
});

const { symbols, collisions } = collectSymbols(root);
const byId = Object.fromEntries(symbols.map(s => [s.id, s]));

// add + overwrite of the same name merge into one record
const alpha = byId["command:alpha"];
assert.ok(alpha, "command:alpha exists");
assert.deepStrictEqual(alpha.overrides, ["cypress/commands/platform/gitSyncAppCommands.js:1"]);
assert.strictEqual(symbols.filter(s => s.name === "alpha").length, 1);

// tagged block wins; untagged falls back to the path's default area
assert.deepStrictEqual(alpha.areas, ["gitSync"]);
assert.deepStrictEqual(byId["command:beta"].areas, ["gitSync"]);
assert.deepStrictEqual(byId["command:untaggedShared"].areas, ["shared"]);

// same helper name in two files: both ids carry the file, one collision entry
const dups = symbols.filter(s => s.name === "dupHelper");
assert.strictEqual(dups.length, 2);
for (const d of dups) assert.match(d.id, /^helper:dupHelper@cypress\/support\/utils\/platform\/[ab]\.js$/);
assert.strictEqual(collisions.length, 1);
assert.strictEqual(collisions[0].files.length, 2);

// a legacy App Builder block on a shared file does not become an area
assert.deepStrictEqual(byId["helper:legacyHelper"].areas, ["shared"]);

// suiteIndex folder is never scanned
assert.ok(!symbols.some(s => s.name === "shouldNotAppear"));

// selector common flag: known generic key, or last segment declared in 3+ selector files
assert.strictEqual(byId["selector:one.cancelButton"].common, true);
assert.strictEqual(byId["selector:one.only"].common, false);
assert.strictEqual(byId["selector:c.saveIt"].common, true);
assert.deepStrictEqual(byId["selector:t.saveIt"].areas, ["tooljetDatabase"]);
assert.deepStrictEqual(byId["selector:u.saveIt"].areas, ["appBuilder"]);

// selectors carry no usage
assert.ok(!("usage" in byId["selector:one.only"]));

// key order is fixed
assert.deepStrictEqual(Object.keys(alpha), ["id", "kind", "name", "file", "line", "areas", "type", "usage", "dom", "signature", "hash", "overrides"]);
assert.deepStrictEqual(Object.keys(byId["selector:one.only"]), ["id", "kind", "name", "file", "line", "areas", "hash", "dynamic", "params", "expression", "common"]);

// rendering is stable
const a = renderOutputs(symbols, collisions);
const b = renderOutputs(collectSymbols(root).symbols, collisions);
assert.deepStrictEqual([...a.entries()], [...b.entries()]);
assert.ok(a.has("cypress/support/suiteIndex/symbols.json"));
assert.ok(a.has("cypress/support/suiteIndex/router.md"));
assert.ok(a.has("cypress/support/suiteIndex/gitSync/index.md"));
assert.ok(a.has("cypress/support/suiteIndex/shared/index.md"));
assert.match(a.get("cypress/support/suiteIndex/gitSync/index.md"), /\| alpha \| command \|/);

// writeOutputs writes the views and nothing else
writeOutputs(root);
assert.ok(fs.existsSync(path.join(root, "cypress/support/suiteIndex/symbols.json")));
assert.ok(!fs.existsSync(path.join(root, "cypress/support/suiteIndex/trust.json")));
