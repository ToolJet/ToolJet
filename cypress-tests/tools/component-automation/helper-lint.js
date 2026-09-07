// helper-lint.js
//
// Annotation completeness + index freshness for helper files.
//
//   node tools/component-automation/helper-lint.js <file...>
//
// The domain is inferred from each file's path, so app-builder and platform
// files can be linted in the same invocation and each is checked against its own
// index. Freshness is checked once per domain, over that domain's full file list
// (a partial list would look stale against a complete index).
const path = require("path");
const { lintFile } = require("./tj-annotations");
const { checkSync, DOMAINS } = require("./generate-helper-docs");

const BASE = path.join(__dirname, "../../cypress/support/utils");

/** Which domain owns this helper file? Falls back to appbuilder for legacy paths. */
function domainOf(absPath) {
  const rel = path.relative(BASE, absPath);
  for (const [name, cfg] of Object.entries(DOMAINS)) {
    if (cfg.files.includes(rel)) return name;
  }
  return null;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("helper-lint: no files provided");
  process.exit(1);
}

let bad = 0;

// 1. annotation completeness, per file
for (const f of files) {
  const { violations } = lintFile(f);
  for (const v of violations) { console.error(`${f}:${v.line}  ${v.name} — ${v.reason}`); bad++; }
}

// 2. freshness, per domain touched — over that domain's COMPLETE file list
const touched = new Set();
const unowned = [];
for (const f of files) {
  const d = domainOf(path.resolve(f));
  d ? touched.add(d) : unowned.push(path.relative(BASE, path.resolve(f)));
}

for (const d of touched) {
  const cfg = DOMAINS[d];
  const abs = cfg.files.map((f) => path.join(BASE, f));
  const indexPath = path.join(__dirname, cfg.out);
  for (const s of checkSync(abs, BASE, indexPath, cfg.indexOpts)) {
    console.error(`helper-lint: stale [${d}] — ${s} (re-run generate-helper-docs.js --domain=${d})`);
    bad++;
  }
}

if (unowned.length) {
  console.log(`helper-lint: not in any domain file list, annotation-checked only: ${unowned.join(", ")}`);
}

if (bad) { console.error(`\nhelper-lint: ${bad} violation(s)`); process.exit(1); }
console.log(`helper-lint: clean (${files.length} file(s), domains: ${[...touched].join(", ") || "none"})`);
