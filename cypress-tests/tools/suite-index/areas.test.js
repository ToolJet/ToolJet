const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { AREAS, APP_BUILDER_BLOCKS, suiteForPath, defaultAreaForPath, validBlocks, SPEC_AREAS } = require("./areas");
const { parseAnnotations } = require("../component-automation/tj-annotations");

assert.strictEqual(suiteForPath("cypress/support/utils/appBuilder/csa.js"), "appBuilder");
assert.strictEqual(suiteForPath("cypress/commands/workflows/workflowsApiCommands.js"), "workflows");
assert.strictEqual(suiteForPath("cypress/support/utils/tooljetDatabase/database.js"), "tooljetDatabase");
assert.strictEqual(suiteForPath("cypress/commands/commands.js"), "shared");
assert.strictEqual(defaultAreaForPath("cypress/commands/platform/gitSyncAppCommands.js"), "gitSync");
assert.strictEqual(defaultAreaForPath("cypress/commands/platform/cloudApiCommands.js"), "cloud");
assert.strictEqual(defaultAreaForPath("cypress/support/utils/platform/modules.js"), "modules");
assert.strictEqual(defaultAreaForPath("cypress/support/utils/platform/groupsUI.js"), "shared");
assert.strictEqual(defaultAreaForPath("cypress/commands/commands.js"), "shared");
assert.strictEqual(defaultAreaForPath("cypress/support/utils/appBuilder/csa.js"), null);
assert.strictEqual(suiteForPath("cypress/constants/selectors/appBuilder/components/common.js"), "appBuilder");
assert.strictEqual(defaultAreaForPath("cypress/constants/selectors/tooljetDatabase/database.js"), "tooljetDatabase");
assert.strictEqual(defaultAreaForPath("cypress/constants/selectors/platform/gitsync.js"), "gitSync");
assert.strictEqual(suiteForPath("cypress/constants/selectors/platform/groups.js"), "platform");

assert.ok(validBlocks("appBuilder").includes("pages"));
assert.ok(validBlocks("appBuilder").includes("querymanager"));
assert.ok(!validBlocks("appBuilder").includes("modules"));
assert.ok(!validBlocks("workflows").includes("properties"));
assert.ok(validBlocks("platform").includes("gitSync"));
assert.ok(validBlocks("shared").includes("common") && validBlocks("shared").includes("events"));
assert.ok(validBlocks("shared").includes("shared"));

assert.strictEqual(AREAS.length, 13);
assert.strictEqual(APP_BUILDER_BLOCKS.length, 11);
for (const s of SPEC_AREAS) assert.ok(AREAS.includes(s.area), `unknown area ${s.area}`);

// Every annotated App Builder helper the existing generator indexes has a valid block.
const genSrc = fs.readFileSync(path.join(__dirname, "../component-automation/generate-helper-docs.js"), "utf8");
const files = [...genSrc.matchAll(/"(appBuilder\/[^"]+\.js)"/g)].map(m => m[1]);
assert.ok(files.length >= 24, "found the generator's file list");
const utils = path.join(__dirname, "../../cypress/support/utils");
for (const f of files)
  for (const r of parseAnnotations(fs.readFileSync(path.join(utils, f), "utf8")).filter(x => x.hasAnnotation))
    assert.ok(validBlocks("appBuilder").includes(r.tjBlock), `${f}: ${r.name} block '${r.tjBlock}'`);
