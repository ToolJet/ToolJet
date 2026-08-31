const path = require("path");
const { lintFile } = require("./tj-annotations");
const { checkSync } = require("./generate-helper-docs");

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("helper-lint: no files provided");
  process.exit(1);
}
let bad = 0;
for (const f of files) {
  const { violations } = lintFile(f);
  for (const v of violations) { console.error(`${f}:${v.line}  ${v.name} — ${v.reason}`); bad++; }
}

// Freshness check: detect header/index drift
const base = path.join(__dirname, "../../cypress/support/utils");
const indexPath = path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md");
const absPaths = files.map(f => path.resolve(f));
const stale = checkSync(absPaths, base, indexPath);
for (const s of stale) { console.error(`helper-lint: stale — ${s} (re-run generate-helper-docs.js)`); bad++; }

if (bad) { console.error(`\nhelper-lint: ${bad} violation(s)`); process.exit(1); }
console.log("helper-lint: clean");
