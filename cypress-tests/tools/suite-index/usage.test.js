const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { collectUsage, areaOfSpec, oneLine } = require("./usage");
const { collectSymbols } = require("./generate");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "suite-usage-"));
const write = (rel, src) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), src);
};
write("cypress/commands/platform/platformApiCommands.js", 'Cypress.Commands.add("apiLogin", (e) => {});\n');
write("cypress/support/utils/platform/modules.js", "export const createModuleViaAPI = (name, opts) => {};\nexport const apiLogin = (u) => {};\n");
const MOD = "cypress/e2e/happyPath/platform/eeTestcases/modules/crud/a.cy.js";
const APPS = "cypress/e2e/happyPath/platform/commonTestcases/apps/b.cy.js";
write(MOD, [
  'import { createModuleViaAPI } from "Support/utils/platform/modules";',
  'import * as ns from "Support/utils/platform/modules";',
  'it("x", () => {',
  '  cy.apiLogin("a@b.c");',
  "  createModuleViaAPI(",
  '    "QA module",',
  "    { folder: 1 }",
  "  );",
  "  ns.createModuleViaAPI();",
  "});",
  "",
].join("\n"));
write(APPS, 'import { apiLogin } from "Support/utils/platform/modules";\nit("y", () => {\n  cy.apiLogin();\n  apiLogin("helper");\n});\n');
write("cypress/support/utils/platform/other.js", "export const createModuleViaAPI = () => {};\n");
write("cypress/e2e/happyPath/platform/eeTestcases/modules/chain.cy.js", 'it("c", () => {\n  cy.wrap(1).apiLogin("chained");\n});\n');
write("cypress/e2e/happyPath/appbuilder/c.cy.js", 'it("z", () => {\n  cy.apiLogin();\n});\n');

assert.strictEqual(areaOfSpec(MOD), "modules");
assert.strictEqual(areaOfSpec(APPS), "apps");
assert.strictEqual(areaOfSpec("cypress/e2e/happyPath/appbuilder/c.cy.js"), null);

const usage = collectUsage(root, collectSymbols(root).symbols);
assert.deepStrictEqual([...usage.get("command:apiLogin").areas].sort(), ["apps", "modules"]);
const create = usage.get("helper:createModuleViaAPI@cypress/support/utils/platform/modules.js");
assert.deepStrictEqual([...create.areas], ["modules"]);
assert.strictEqual(create.sites.length, 1, "namespace call ignored");
assert.strictEqual(create.sites[0].text, 'createModuleViaAPI("QA module", { folder: 1 })');
assert.strictEqual(create.sites[0].line, 5);
assert.ok(usage.get("command:apiLogin").sites.some(x => x.text === 'cy.apiLogin("a@b.c")'));
assert.strictEqual(usage.get("command:apiLogin").sites.length, 3, "appbuilder spec outside SPEC_AREAS is ignored; chained call counted");
assert.ok(usage.get("command:apiLogin").sites.some(x => x.text === 'cy.wrap(1).apiLogin("chained")'));

// a helper and a command with the same name keep separate call sites
assert.deepStrictEqual(usage.get("helper:apiLogin@cypress/support/utils/platform/modules.js").sites.map(x => x.text), ['apiLogin("helper")']);
assert.ok(usage.get("command:apiLogin").sites.every(x => x.text.startsWith("cy.")));

// same helper name in another file: calls count only for the file the spec imports from
assert.ok(!usage.has("helper:createModuleViaAPI@cypress/support/utils/platform/other.js"));

// data source folder permissions sit with app folder permissions
assert.strictEqual(areaOfSpec("cypress/e2e/happyPath/platform/eeTestcases/dataSourceFolders/x.cy.js"), "access");

// trailing commas are dropped from one-line examples
assert.strictEqual(oneLine("f({\n  a: 1,\n})"), "f({ a: 1 })");
