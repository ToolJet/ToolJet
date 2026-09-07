const fs = require("fs");
const path = require("path");
const { parseAnnotations, parseCommandAnnotations } = require("./tj-annotations");

const HEADER_START = "// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐";
const HEADER_END   = "// └──────────────────────────────────────────────────────────────────┘";

function buildHeaderBlock(fileName, records) {
  const rows = records.filter(r => r.hasAnnotation).map(r =>
    `//   ${r.name.padEnd(32)} ${(r.tjType.join(", ") || "-").padEnd(20)} → ${r.tjBlock}`);
  return [HEADER_START, `// ${fileName}`, ...rows, HEADER_END].join("\n");
}

/** Escape a Markdown table cell value: replace | with \| and collapse newlines. */
function escapeMdCell(val) {
  return val.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").trim();
}

/**
 * @param {object} fileToRecords  relative file path -> parsed annotation records
 * @param {object} [opts]
 * @param {string} [opts.title]   index heading
 * @param {string} [opts.keyCol]  first column header. app-builder keys on the widget
 *                                config field type; platform has no config schema, so it
 *                                keys on `entity.op` instead. Same slot, different meaning.
 */
function buildMappingIndex(fileToRecords, opts = {}) {
  const title = opts.title || "type-helper-index";
  const keyCol = opts.keyCol || "config type";
  const lines = [`# ${title} (AUTO-GENERATED — do not edit)`, "",
    `| ${keyCol} | helper | file | block | usage |`, "|---|---|---|---|---|"];
  for (const [file, recs] of Object.entries(fileToRecords))
    for (const r of recs.filter(x => x.hasAnnotation))
      for (const t of (r.tjType.length ? r.tjType : ["-"]))
        lines.push(`| ${escapeMdCell(t)} | \`${escapeMdCell(r.name)}\` | ${escapeMdCell(file)} | ${escapeMdCell(r.tjBlock)} | \`${escapeMdCell(r.tjUsage)}\` |`);
  return lines.join("\n") + "\n";
}

/**
 * Command index. Commands carry a single @tjCmd tag holding "<category> · <when to
 * use it>", so the columns differ from the helper index: the routing key is the
 * category and the "when to use it" half is what a reader picks from.
 */
function buildCommandIndex(fileToRecords) {
  const lines = ["# platform-command-index (AUTO-GENERATED — do not edit)", "",
    "| category | command | file | when to use it | usage |", "|---|---|---|---|---|"];
  for (const [file, recs] of Object.entries(fileToRecords))
    for (const r of recs.filter(x => x.hasAnnotation))
      lines.push(`| ${escapeMdCell(r.category)} | \`cy.${escapeMdCell(r.name)}\` | ${escapeMdCell(file)} | ${escapeMdCell(r.description)} | \`${escapeMdCell(r.tjUsage)}\` |`);
  return lines.join("\n") + "\n";
}

function rewriteHeader(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const recs = parseAnnotations(src);
  const header = buildHeaderBlock(path.basename(filePath), recs);
  const lines = src.split("\n");
  const s = lines.findIndex(l => l.includes("AUTO-GENERATED from @tj"));
  const e = lines.findIndex(l => l.startsWith(HEADER_END));
  let bodyLines;
  if (s !== -1 && e !== -1 && e >= s) {
    let after = e + 1;
    if (lines[after] === "") after += 1;               // absorb one blank line after old header
    bodyLines = [...lines.slice(0, s), ...lines.slice(after)];
  } else {
    bodyLines = lines;
  }
  const body = bodyLines.join("\n").replace(/^\n+/, "");
  fs.writeFileSync(filePath, header + "\n" + body);
  return recs;
}

/**
 * Regenerate each file's header block and the index IN MEMORY; compare to disk.
 * Returns an array of stale artifact descriptions (empty = all fresh).
 *
 * @param {string[]} filePaths  - absolute paths to the annotated helper files
 * @param {string}   base       - path prefix to strip for relative file keys
 * @param {string}   indexPath  - absolute path to type-helper-index.md
 */
function checkSync(filePaths, base, indexPath, indexOpts = {}) {
  const stale = [];
  const map = {};
  for (const f of filePaths) {
    const src = fs.readFileSync(f, "utf8");
    const recs = parseAnnotations(src);
    const header = buildHeaderBlock(path.basename(f), recs);
    // Compute what the file SHOULD look like after a rewrite
    const lines = src.split("\n");
    const s = lines.findIndex(l => l.includes("AUTO-GENERATED from @tj"));
    const e = lines.findIndex(l => l.startsWith(HEADER_END));
    let bodyLines;
    if (s !== -1 && e !== -1 && e >= s) {
      let after = e + 1;
      if (lines[after] === "") after += 1;
      bodyLines = [...lines.slice(0, s), ...lines.slice(after)];
    } else {
      bodyLines = lines;
    }
    const body = bodyLines.join("\n").replace(/^\n+/, "");
    const expected = header + "\n" + body;
    if (src !== expected) stale.push(path.relative(base, f) + " (header block)");
    map[path.relative(base, f)] = recs;
  }
  // Check index
  const expectedIndex = buildMappingIndex(map, indexOpts);
  const actualIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  if (actualIndex !== expectedIndex) stale.push("type-helper-index.md");
  return stale;
}

// ── domain configs ───────────────────────────────────────────────────────────
// Each domain has its own file list and its own generated index. The machinery is
// shared; only the routing-key column differs (see buildMappingIndex).
const DOMAINS = {
  appbuilder: {
    out: "../../cypress/support/componentAutomation/type-helper-index.md",
    indexOpts: {},                                   // defaults: "type-helper-index" / "config type"
    files: [
    "appBuilder/properties.js",
    "appBuilder/styles.js",
    "appBuilder/components.js",
    "appBuilder/layout.js",
    "appBuilder/inspectorTree.js",
    "appBuilder/canvas.js",
    "appBuilder/events.js",
    "appBuilder/csa.js",
    "appBuilder/codehinter.js",
    "appBuilder/editorHeader.js",
    "appBuilder/pages.js",
    "appBuilder/querymanager/queries.js",
    "appBuilder/querymanager/queryPanel.js",
    "appBuilder/components/button.js",
    "appBuilder/components/table.js",
    "appBuilder/components/dropdown.js",
    "appBuilder/components/datePicker.js",
    "appBuilder/components/listView.js",
    "appBuilder/components/multiSelect.js",
    "appBuilder/components/modal.js",
    "appBuilder/components/basicComponents.js",
    "appBuilder/components/inputField.js",
    "appBuilder/components/properties/common.js",
    "appBuilder/components/properties/imageComponent.js",
    ],
  },
  platform: {
    out: "../../cypress/support/componentAutomation/platform-helper-index.md",
    indexOpts: { title: "platform-helper-index", keyCol: "entity.op" },
    files: [
      "platform/eeCommon.js",
      "platform/groupsUI.js",
      "platform/customGroups.js",
      "platform/allUsers.js",
      "platform/allWorkspace.js",
      "platform/multiEnv.js",
      "platform/licenseLimits.js",
      "platform/smtp.js",
      "platform/ai.js",
      "platform/apiUtils/commonApi.js",
      "platform/apiUtils/apiWSConstants.js",
      // Platform-facing helpers at the root of utils/. Left in place on this
      // release line: relocating them would rewrite imports in 50+ specs, and
      // this change is deliberately annotation-only.
      "apps.js",
      "common.js",
      "dashboard.js",
      "exportImport.js",
      "externalApi.js",
      "license.js",
      "manageGroups.js",
      "manageSSO.js",
      "manageUsers.js",
      "onboarding.js",
      "profile.js",
      "selfHostSignUp.js",
      "uiPermissions.js",
      "userPermissions.js",
      "version.js",
      "whitelabel.js",
      "workspaceConstants.js",
    ],
  },
};

if (require.main === module) {
  const base = path.join(__dirname, "../../cypress/support/utils");
  const domainArg = process.argv.find(a => a.startsWith("--domain="));
  const domainName = domainArg ? domainArg.split("=")[1] : "appbuilder";
  const domain = DOMAINS[domainName];
  if (!domain) {
    console.error(`unknown --domain=${domainName}. known: ${Object.keys(DOMAINS).join(", ")}`);
    process.exit(1);
  }
  const files = domain.files.map(f => path.join(base, f));
  const out = path.join(__dirname, domain.out);

  if (process.argv.includes("--check")) {
    const stale = checkSync(files, base, out, domain.indexOpts);
    if (stale.length === 0) {
      console.log("generate-helper-docs --check: all fresh");
      process.exit(0);
    } else {
      console.error("generate-helper-docs --check: stale artifacts detected:");
      stale.forEach(s => console.error("  " + s));
      console.error(`Re-run: node tools/component-automation/generate-helper-docs.js --domain=${domainName}`);
      process.exit(1);
    }
  }

  const map = {};
  for (const f of files) map[path.relative(base, f)] = rewriteHeader(f);
  fs.writeFileSync(out, buildMappingIndex(map, domain.indexOpts));
  console.log(`generated headers + ${path.basename(out)} (domain: ${domainName})`);
}

module.exports = { buildHeaderBlock, buildMappingIndex, buildCommandIndex, rewriteHeader, checkSync, escapeMdCell, DOMAINS };
