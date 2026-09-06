// Generate the platform command index from @tjCmd annotations.
// Commands are declared with Cypress.Commands.add(...) rather than `export const`,
// so they need their own parser and index shape — see tj-annotations.js.
//
//   node tools/component-automation/generate-command-docs.js
//   node tools/component-automation/generate-command-docs.js --check
const fs = require("fs");
const path = require("path");
const { parseCommandAnnotations, lintCommandFile } = require("./tj-annotations");
const { buildCommandIndex } = require("./generate-helper-docs");

const BASE = path.join(__dirname, "../../cypress/commands");
const OUT = path.join(__dirname, "../../cypress/support/componentAutomation/platform-command-index.md");

const FILES = [
  "platform/platformApiCommands.js",
  "platform/gitSyncCommands.js",
  "platform/gitSyncAppCommands.js",
];

function build() {
  const map = {};
  for (const f of FILES) {
    map[f] = parseCommandAnnotations(fs.readFileSync(path.join(BASE, f), "utf8"));
  }
  return map;
}

if (require.main === module) {
  const map = build();
  const expected = buildCommandIndex(map);

  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (actual === expected) { console.log("generate-command-docs --check: fresh"); process.exit(0); }
    console.error("generate-command-docs --check: platform-command-index.md is stale");
    console.error("Re-run: node tools/component-automation/generate-command-docs.js");
    process.exit(1);
  }

  if (process.argv.includes("--lint")) {
    let bad = 0;
    for (const f of FILES) {
      for (const v of lintCommandFile(path.join(BASE, f)).violations) {
        console.error(`${f}:${v.line}  ${v.name} — ${v.reason}`);
        bad++;
      }
    }
    if (bad) { console.error(`command-lint: ${bad} violation(s)`); process.exit(1); }
    console.log("command-lint: clean");
    process.exit(0);
  }

  fs.writeFileSync(OUT, expected);
  const n = Object.values(map).reduce((s, r) => s + r.filter((x) => x.hasAnnotation).length, 0);
  console.log(`generated platform-command-index.md (${n} commands)`);
}

module.exports = { build, FILES, OUT };
