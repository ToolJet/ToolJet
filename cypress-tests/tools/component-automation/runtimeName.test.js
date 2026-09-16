const assert = require("assert");
const { deriveCandidate, resolveRuntimeName } = require("../../cypress/support/componentAutomation/runtimeName");

assert.strictEqual(deriveCandidate("Number Input"), "numberinput1");
assert.strictEqual(deriveCandidate("Text Input"), "textinput1");

// cache hit wins over derivation (this is the richtexteditor1 fix)
const cache = { components: { richTextarea: { runtimeName: "richtexteditor1" } } };
assert.deepStrictEqual(resolveRuntimeName("richTextarea", cache), { name: "richtexteditor1", source: "cache" });
// cache miss falls back to candidate
assert.deepStrictEqual(resolveRuntimeName("Number Input", cache), { name: "numberinput1", source: "candidate" });
console.log("runtimeName.test PASS");
