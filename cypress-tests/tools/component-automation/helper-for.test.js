// helper-for.test.js
const assert = require("assert");
const fs = require("fs"); const path = require("path");
const { parseIndex, helperFor, COMPOSITE_HELPERS } = require("./helper-for");

const idx = parseIndex(fs.readFileSync(
  path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md"), "utf8"));

// toggle in properties → verifyAndModifyToggleFx (NOT verifyLayout, which is composite)
const t = helperFor("toggle", "properties", idx);
assert(JSON.stringify(t).includes("verifyAndModifyToggleFx"), "toggle→verifyAndModifyToggleFx");
assert(!JSON.stringify(t).includes("verifyLayout"), "composite verifyLayout must be excluded");

// colorSwatches in styles → both select + verify, select first
const c = helperFor("colorSwatches", "styles", idx);
const names = (c.helpers || [c]).map(h => h.helper);
assert(names.includes("selectColourFromColourPicker") && names.includes("verifyWidgetColorCss"));
assert(names.indexOf("selectColourFromColourPicker") < names.indexOf("verifyWidgetColorCss"), "select before verify");

// unknown type → null
assert.strictEqual(helperFor("nope", "styles", idx), null);
assert(COMPOSITE_HELPERS.includes("verifyLayout"));
console.log("helper-for.test PASS");
