// spec-helpers-lint.js
const fs = require("fs");
const { parseIndex } = require("./helper-for");
const UTIL_RE = /import\s*\{([^}]+)\}\s*from\s*["']Support\/utils\/(commonWidget|events|editor\/textInput|inspector)["']/g;

function lintSpecHelpers(specPath, rows) {
  const src = fs.readFileSync(specPath, "utf8");
  const known = new Set(rows.map(r => r.helper));
  const violations = [];
  let m;
  while ((m = UTIL_RE.exec(src)) !== null) {
    for (const name of m[1].split(",").map(s => s.trim()).filter(Boolean)) {
      if (!known.has(name)) violations.push({ helper: name, reason: `not in type-helper-index` });
    }
  }
  return { violations };
}

if (require.main === module) {
  const path = require("path");
  const rows = parseIndex(fs.readFileSync(path.join(__dirname, "../../cypress/support/componentAutomation/type-helper-index.md"), "utf8"));
  let bad = 0;
  for (const f of process.argv.slice(2)) for (const v of lintSpecHelpers(f, rows).violations) { console.error(`${f}: ${v.helper} — ${v.reason}`); bad++; }
  if (bad) { console.error(`spec-helpers-lint: ${bad} violation(s)`); process.exit(1); }
  console.log("spec-helpers-lint: clean");
}
module.exports = { lintSpecHelpers };
