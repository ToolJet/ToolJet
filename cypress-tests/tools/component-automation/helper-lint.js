const { lintFile } = require("./tj-annotations");
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
if (bad) { console.error(`\nhelper-lint: ${bad} violation(s)`); process.exit(1); }
console.log("helper-lint: clean");
