const assert = require("assert");
const { entityOp, draftTags, draftAllTags, applyTags, pickUsage } = require("./draft-tags");
const { parseHelpers, parseCommands } = require("./parse");

// entity.op from the name
assert.strictEqual(entityOp("createModuleViaAPI"), "module.create");
assert.strictEqual(entityOp("apiCreateWorkspace"), "workspace.create");
assert.strictEqual(entityOp("openModulesList"), "modulesList.open");
assert.strictEqual(entityOp("uiRenameFolder"), "folder.rename");
assert.strictEqual(entityOp("phase"), "-");
assert.strictEqual(entityOp("attemptDeleteModuleFromList"), "module.delete");
assert.strictEqual(entityOp("renameModuleFromList"), "module.rename");
assert.strictEqual(entityOp("dragModuleIntoCanvas"), "module.drag");
assert.strictEqual(entityOp("openModuleEditorExpectingReadOnly"), "moduleEditor.open");
assert.strictEqual(entityOp("apiAddUserToGroup"), "userToGroup.add");
assert.strictEqual(entityOp("gitSyncPull"), "gitSync.pull");
assert.strictEqual(entityOp("apiGitSyncPull"), "gitSync.pull");
assert.strictEqual(entityOp("gitHubCreatePR"), "pr.create");

// usage: prefer this area's sites, then calls with arguments; skip text the tag reader would cut
const site = (file, text) => ({ file, line: 1, text });
assert.strictEqual(pickUsage([site("apps.cy.js", "cy.apiLogin()"), site("mod.cy.js", 'cy.apiLogin("a")')], ["mod.cy.js"]), 'cy.apiLogin("a")');
assert.strictEqual(pickUsage([site("a", 'cy.get("@alias")')], ["a"]), "");
assert.strictEqual(pickUsage([site("a", "x".repeat(130))], ["a"]), "");
// negative/empty calls are not proposed; the most common call shape wins
assert.strictEqual(pickUsage([site("a", "createUser({})"), site("a", 'createUser("")'), site("a", "createUser(invalidAuth)"), site("a", "createUser(user)")], ["a"]), "createUser(user)");
assert.strictEqual(pickUsage([site("a", "f(x)"), site("b", "f(longer, args)"), site("c", "f(longer, args)")], []), "f(longer, args)");

// draftTags: single area -> that area; several -> shared; App Builder files skipped
const sym = (o) => ({ kind: "helper", type: [], usage: "", line: 1, areas: ["shared"], id: `${o.kind || "helper"}:${o.name}`, ...o });
const symbols = [
  sym({ name: "createModuleViaAPI", file: "cypress/support/utils/platform/modules.js", areas: ["modules"] }),
  sym({ name: "apiLogin", kind: "command", file: "cypress/commands/platform/platformApiCommands.js" }),
  sym({ name: "dragAndDropWidget", kind: "command", file: "cypress/commands/appbuilder/appbuilderCommands.js", areas: ["appBuilder"] }),
  sym({ name: "intercept", kind: "command", file: "cypress/commands/commands.js" }),
];
const usage = new Map([
  ["helper:createModuleViaAPI@cypress/support/utils/platform/modules.js", { areas: new Set(["modules"]), sites: [site("cypress/e2e/m.cy.js", 'createModuleViaAPI("QA")')] }],
  ["command:apiLogin", { areas: new Set(["modules", "apps"]), sites: [site("cypress/e2e/m.cy.js", "cy.apiLogin()")] }],
  ["command:intercept", { areas: new Set(["modules"]), sites: [site("cypress/e2e/m.cy.js", 'cy.intercept("GET", "/x")')] }],
  ["command:dragAndDropWidget", { areas: new Set(["modules"]), sites: [site("cypress/e2e/m.cy.js", "cy.dragAndDropWidget(1)")] }],
]);
const drafts = draftTags(symbols, usage, "modules", (f) => /\/m\.cy\.js$/.test(f));
assert.deepStrictEqual(drafts.map(d => [d.name, d.block, d.type, d.usage]), [
  ["apiLogin", "shared", "-", "cy.apiLogin()"],
  ["createModuleViaAPI", "modules", "module.create", 'createModuleViaAPI("QA")'],
]);

// applyTags: bare export gets a full block that the parser reads back
const bare = "export const createModuleViaAPI = (name) => {};\n";
const t1 = applyTags(bare, [{ line: 1, type: "module.create", block: "modules", usage: 'createModuleViaAPI("QA")' }]);
const h = parseHelpers(t1, "x.js").records[0];
assert.deepStrictEqual([h.block, h.usage, h.type], ["modules", 'createModuleViaAPI("QA")', ["module.create"]]);
assert.strictEqual(applyTags(t1, [{ line: 6, type: "module.create", block: "modules", usage: 'createModuleViaAPI("QA")' }]), t1, "idempotent");

// existing @tjCmd/@tjUsage block: keep it, add only the missing tags
const cmd = [
  "/**",
  " * @tjCmd   api · log in",
  " * @tjUsage cy.apiLogin()",
  " */",
  'Cypress.Commands.add("apiLogin", () => {});',
  "",
].join("\n");
const t2 = applyTags(cmd, [{ line: 5, type: "-", block: "shared", usage: 'cy.apiLogin("other")' }]);
assert.strictEqual(t2.split("\n").filter(l => l.includes("@tjUsage")).length, 1);
assert.ok(t2.includes(" * @tjCmd   api · log in"));
const c = parseCommands(t2, "c.js").records[0];
assert.deepStrictEqual([c.block, c.usage], ["shared", "cy.apiLogin()"]);
assert.ok(!t2.includes("@tjType"), "type '-' is not written");

// export-list helper: block goes above the local declaration
const list = "const localA = (x) => x;\n\nexport { localA };\n";
const t3 = applyTags(list, [{ line: 1, type: "-", block: "licensing", usage: "localA(1)" }]);
assert.strictEqual(parseHelpers(t3, "l.js").records[0].block, "licensing");

// all areas at once: one draft per symbol, block from every area that uses it
const all = draftAllTags(symbols, new Map([
  ["helper:createModuleViaAPI@cypress/support/utils/platform/modules.js", { areas: new Set(["modules"]), sites: [site("cypress/e2e/m.cy.js", 'createModuleViaAPI("QA")')] }],
  ["command:apiLogin", { areas: new Set(["gitSync"]), sites: [site("cypress/e2e/g.cy.js", "cy.apiLogin(1)")] }],
]));
assert.ok(!drafts.some(d => d.name === "intercept"), "overrides of Cypress built-ins are not labelled");
// apiLogin lives in a general-purpose file, so it stays shared even with one calling area
assert.deepStrictEqual(all.map(d => [d.name, d.block]), [["apiLogin", "shared"], ["createModuleViaAPI", "modules"]]);
