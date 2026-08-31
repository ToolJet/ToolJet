const assert = require("assert");
const { buildHeaderBlock, buildMappingIndex } = require("./generate-helper-docs");
const { parseAnnotations } = require("./tj-annotations");
const fs = require("fs");
const path = require("path");

const recs = parseAnnotations(fs.readFileSync(path.join(__dirname, "__fixtures__/good.helper.js"), "utf8"));
const header = buildHeaderBlock("good.helper.js", recs);
assert.match(header, /AUTO-GENERATED from @tj annotations/);
assert.match(header, /annotatedHelper/);
assert.match(header, /toggle, switch/);

const idx = buildMappingIndex({ "commonWidget.js": recs });
assert.match(idx, /\| toggle \|/);            // type row present
assert.match(idx, /annotatedHelper/);         // helper named
assert.match(idx, /commonWidget\.js/);        // file named
console.log("generate-helper-docs.test PASS");
