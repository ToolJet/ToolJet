const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { findSymbols, loadSymbols, tokens, formatHit } = require("./find");

const rec = (o) => ({ type: [], usage: "", file: "", line: 1, ...o });
const recs = [
  rec({ id: "command:gitHubMergePR", kind: "command", name: "gitHubMergePR", areas: ["gitSync"], usage: "cy.gitHubMergePR(prNumber)", file: "cypress/commands/platform/gitSyncAppCommands.js" }),
  rec({ id: "command:gitHubCreatePR", kind: "command", name: "gitHubCreatePR", areas: ["gitSync"] }),
  rec({ id: "helper:randomNumber", kind: "helper", name: "randomNumber", areas: ["shared"] }),
  rec({ id: "selector:s.mergeButton", kind: "selector", name: "s.mergeButton", areas: ["gitSync"], expression: "'[data-cy=\"merge\"]'" }),
  rec({ id: "helper:createModuleViaAPI", kind: "helper", name: "createModuleViaAPI", areas: ["modules"] }),
];

assert.deepStrictEqual(tokens("gitHubMergePR"), ["git", "hub", "merge", "pr"]);
assert.deepStrictEqual(tokens("s.merge_button-x"), ["s", "merge", "button", "x"]);

const hits = findSymbols(recs, "gitSync", ["merge", "pr"]);
assert.strictEqual(hits[0].record.name, "gitHubMergePR");
assert.ok(!hits.some(h => h.record.name === "createModuleViaAPI"), "other areas excluded");
assert.ok(findSymbols(recs, "modules", ["random"]).some(h => h.record.name === "randomNumber"), "shared always included");
assert.deepStrictEqual(findSymbols(recs, "gitSync", ["merge"], { kind: "selector" }).map(h => h.record.name), ["s.mergeButton"]);
assert.strictEqual(findSymbols(recs, "gitSync", ["zzz"]).length, 0);
assert.strictEqual(findSymbols(recs, "gitSync", ["git"], { limit: 1 }).length, 1);

// a symbol in the requested area beats an equally good shared one
const tie = [
  rec({ id: "helper:createFolderShared", kind: "helper", name: "createFolder", areas: ["shared"], file: "a.js" }),
  rec({ id: "helper:createFolderMod", kind: "helper", name: "createFolder", areas: ["modules"], file: "b.js" }),
];
assert.strictEqual(findSymbols(tie, "modules", ["create", "folder"])[0].record.file, "b.js");

// CLI on the real index
const cli = path.join(__dirname, "find.js");
const real = spawnSync("node", [cli, "gitSync", "merge", "pr"], { encoding: "utf8" });
assert.strictEqual(real.status, 0);
assert.match(real.stdout.split("\n")[0], /gitHubMergePR\(/, "signature shown after the name");
const unknown = spawnSync("node", [cli, "nope", "x"], { encoding: "utf8" });
assert.strictEqual(unknown.status, 2);
assert.match(unknown.stderr, /modules/);
const none = spawnSync("node", [cli, "gitSync", "qqqzzzxxx"], { encoding: "utf8" });
assert.strictEqual(none.status, 0);
assert.match(none.stdout, /^no match in gitSync\+shared \(searched \d+ symbols\)/);

// the index is built in memory, so find works on a tree that was never generated
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "suite-find-"));
fs.mkdirSync(path.join(tmp, "cypress/commands/platform"), { recursive: true });
fs.writeFileSync(path.join(tmp, "cypress/commands/platform/gitSyncCommands.js"), 'Cypress.Commands.add("gitHubMergePR", (n) => {});\n');
const fresh = spawnSync("node", [cli, "gitSync", "merge"], { encoding: "utf8", env: { ...process.env, SUITE_INDEX_ROOT: tmp } });
assert.strictEqual(fresh.status, 0);
assert.match(fresh.stdout, /^command  gitHubMergePR\(n\)  cypress\/commands\/platform\/gitSyncCommands\.js:1/);
assert.ok(!fs.existsSync(path.join(tmp, "cypress/support/suiteIndex")), "find writes nothing");
assert.strictEqual(loadSymbols(tmp).symbols.length, 1);

// an exact name match (ignoring the api prefix) ranks above higher-scoring partial matches
const exact = [
  rec({ id: "command:apiCreateWorkflowApp", kind: "command", name: "apiCreateWorkflowApp", areas: ["workflows"], type: ["workflowApp.create"] }),
  rec({ id: "command:apiCreateWorkflow", kind: "command", name: "apiCreateWorkflow", areas: ["shared"], type: ["workflow.create"] }),
];
assert.strictEqual(findSymbols(exact, "workflows", ["create", "workflow"])[0].record.name, "apiCreateWorkflow");
assert.strictEqual(findSymbols(exact, "workflows", ["Workflow", "create"])[0].record.name, "apiCreateWorkflow", "word order and case ignored");

// multi-line signatures and selector expressions still print one line per hit
const multi = formatHit({ record: rec({ kind: "command", name: "x", file: "a.js", signature: "({\n    type = \"a  b\",\n    zone,\n  } = {})", usage: "cy.x()" }) });
assert.strictEqual(multi, 'command  x({ type = "a  b", zone } = {})  a.js:1  cy.x()');
const sel = formatHit({ record: rec({ kind: "selector", name: "s.link", file: "b.js", expression: "(n) => {\n    return n;\n  }" }) });
assert.strictEqual(sel, "selector  s.link  b.js:1  (n) => { return n; }");
