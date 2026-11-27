const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { parseHelpers, parseCommands, parseSelectors, sourceHash } = require("./parse");
const { parseAnnotations } = require("../component-automation/tj-annotations");

const fx = (f) => fs.readFileSync(path.join(__dirname, "__fixtures__", f), "utf8");

// commands: literal names only, multiline supported, tags read from the JSDoc
const cmd = parseCommands(fx("commands.js"), "commands.js");
assert.deepStrictEqual(cmd.records.map(r => r.name), ["alpha", "beta"]);
const alpha = cmd.records[0];
assert.strictEqual(alpha.kind, "command");
assert.strictEqual(alpha.overwrite, false);
assert.strictEqual(alpha.signature, "(a, b)");
assert.strictEqual(alpha.block, "gitSync");
assert.deepStrictEqual(alpha.type, ["pr.merge"]);
assert.strictEqual(alpha.usage, "cy.alpha(1, 2)");
assert.strictEqual(alpha.line, 7);
assert.strictEqual(cmd.records[1].line, 11);
assert.strictEqual(cmd.records[1].block, "");
assert.strictEqual(cmd.warnings.length, 1);
assert.match(cmd.warnings[0].message, /non-literal command name/);

// overwrite
const ow = parseCommands(fx("overwrite.js"), "overwrite.js");
assert.strictEqual(ow.records.length, 1);
assert.strictEqual(ow.records[0].name, "alpha");
assert.strictEqual(ow.records[0].overwrite, true);

// selectors: dotted names, static vs dynamic, spread and computed keys skipped with warnings
const sel = parseSelectors(fx("selectors.js"), "selectors.js");
assert.deepStrictEqual(sel.records.map(r => r.name), ["s.a", "s.b", "s.nested.c"]);
const b = sel.records[1];
assert.strictEqual(b.kind, "selector");
assert.strictEqual(b.dynamic, true);
assert.deepStrictEqual(b.params, ["x"]);
assert.strictEqual(sel.records[0].dynamic, false);
assert.strictEqual(sel.records[0].expression, `'[data-cy="a"]'`);
assert.strictEqual(sel.warnings.length, 2);

// helpers: same names as the existing App Builder parser, plus a hash
const hel = parseHelpers(fx("helpers.js"), "helpers.js");
assert.deepStrictEqual(hel.records.map(r => r.name), parseAnnotations(fx("helpers.js")).map(r => r.name));
for (const r of hel.records) assert.match(r.hash, /^sha256:[0-9a-f]{16}$/);
assert.strictEqual(hel.records[0].block, "properties");
assert.deepStrictEqual(hel.records[0].type, ["toggle", "switch"]);
assert.strictEqual(hel.records[1].signature, "(a)");

// export lists: exported name, declaration line, tags from the declaration's JSDoc
const el = parseHelpers(fx("exportList.js"), "exportList.js");
assert.deepStrictEqual(el.records.map(r => r.name), ["localA", "renamedB"]);
assert.strictEqual(el.records[0].line, 5);
assert.strictEqual(el.records[0].block, "licensing");
assert.strictEqual(el.records[0].usage, "localA('x')");
assert.strictEqual(el.records[0].signature, "(x)");
assert.strictEqual(el.records[1].line, 7);

// every export form is indexed, not only `export const|function`
const me = parseHelpers(fx("modernExports.js"), "modernExports.js");
assert.deepStrictEqual(me.records.map(r => r.name), ["loadThing", "counter", "Page", "first", "renamed", "steps"]);
assert.strictEqual(me.records[0].block, "modules");
assert.strictEqual(me.records[0].usage, "await loadThing(1)");
assert.strictEqual(me.records[0].signature, "(id)");
assert.strictEqual(me.records[0].line, 5);

// parse errors are warnings, never throws
const br = parseCommands(fx("broken.js"), "broken.js");
assert.deepStrictEqual(br.records, []);
assert.match(br.warnings[0].message, /^parse-error/);
assert.match(parseSelectors(fx("broken.js"), "broken.js").warnings[0].message, /^parse-error/);

assert.strictEqual(sourceHash("x"), sourceHash("x"));
assert.notStrictEqual(sourceHash("x"), sourceHash("y"));
