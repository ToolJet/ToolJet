// spec-helpers-lint.js
//
// Anti-hallucination gate: a spec may only import helpers that appear in a
// generated index. If an agent cannot find a helper it must say so
// (RESOLVE-LIVE) rather than invent one — this is what makes that binding.
//
//   node tools/component-automation/spec-helpers-lint.js <spec...>
//
// Covers every indexed domain. A module that is not yet indexed (marketplace,
// workflows) is skipped and reported, so the gate never produces false
// positives for surfaces we have not annotated yet.
const fs = require("fs");
const path = require("path");
const { parseIndex } = require("./helper-for");

const INDEXES = [
  "../../cypress/support/componentAutomation/type-helper-index.md",
  "../../cypress/support/componentAutomation/platform-helper-index.md",
];

// any named import from the utils tree, at any depth
const UTIL_RE = /import\s*\{([^}]+)\}\s*from\s*["']Support\/utils\/([A-Za-z0-9_/]+)["']/g;

/** @returns {{known:Set<string>, modules:Set<string>}} names and files the indexes cover */
function loadIndexes() {
  const known = new Set();
  const modules = new Set();
  for (const rel of INDEXES) {
    const p = path.join(__dirname, rel);
    if (!fs.existsSync(p)) continue;
    for (const r of parseIndex(fs.readFileSync(p, "utf8"))) {
      known.add(r.helper);
      // index "file" column is relative to support/utils, e.g. platform/apps.js
      modules.add(r.file.replace(/\.js$/, ""));
    }
  }
  return { known, modules };
}

function lintSpecHelpers(specPath, known, modules) {
  const src = fs.readFileSync(specPath, "utf8");
  const violations = [];
  const skipped = new Set();
  let m;
  UTIL_RE.lastIndex = 0;
  while ((m = UTIL_RE.exec(src)) !== null) {
    const mod = m[2];
    // Only gate modules the indexes actually cover. `commonWidget` is the
    // app-builder barrel: its re-exports are indexed under their real files, so
    // the names resolve even though the barrel itself is not an index row.
    if (!modules.has(mod) && mod !== "commonWidget") { skipped.add(mod); continue; }
    for (const raw of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      const name = raw.split(/\s+as\s+/)[0].trim(); // strip "as alias"
      if (!known.has(name)) violations.push({ helper: name, module: mod, reason: "not in any helper index" });
    }
  }
  return { violations, skipped: [...skipped] };
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (files.length === 0) { console.error("spec-helpers-lint: no files provided"); process.exit(1); }

  const { known, modules } = loadIndexes();
  if (known.size === 0) { console.error("spec-helpers-lint: no index found — run generate-helper-docs first"); process.exit(1); }

  let bad = 0;
  const allSkipped = new Set();
  for (const f of files) {
    const { violations, skipped } = lintSpecHelpers(f, known, modules);
    skipped.forEach((s) => allSkipped.add(s));
    for (const v of violations) {
      console.error(`${f}: ${v.helper} (from Support/utils/${v.module}) — ${v.reason}`);
      bad++;
    }
  }
  if (allSkipped.size) {
    console.log(`spec-helpers-lint: not gated (module not indexed): ${[...allSkipped].sort().join(", ")}`);
  }
  if (bad) { console.error(`spec-helpers-lint: ${bad} violation(s) across ${files.length} spec(s)`); process.exit(1); }
  console.log(`spec-helpers-lint: clean (${known.size} indexed helpers, ${files.length} spec(s))`);
}

module.exports = { lintSpecHelpers, loadIndexes };
