const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const dirs = [path.join(__dirname), path.join(__dirname, "../component-automation")];
let failed = 0;
for (const dir of dirs) {
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".test.js")).sort()) {
    const r = spawnSync("node", [path.join(dir, f)], { encoding: "utf8" });
    const name = path.relative(path.join(__dirname, ".."), path.join(dir, f));
    if (r.status === 0) console.log(`PASS ${name}`);
    else { failed++; console.log(`FAIL ${name}\n${(r.stderr || r.stdout).split("\n").slice(0, 12).join("\n")}`); }
  }
}
console.log(failed ? `${failed} test file(s) failed` : "all test files passed");
process.exit(failed ? 1 : 0);
