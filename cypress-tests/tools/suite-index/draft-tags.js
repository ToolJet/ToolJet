const fs = require("fs");
const path = require("path");
const { suiteForPath, validBlocks, AREAS } = require("./areas");
const { collectSymbols } = require("./generate");
const { collectUsage, areaOfSpec } = require("./usage");
const { tokens } = require("./find");

const VERBS = new Set([
  "create", "delete", "rename", "update", "add", "remove", "get", "open", "close", "verify", "expect",
  "publish", "promote", "import", "export", "login", "logout", "navigate", "switch", "drag", "drop",
  "select", "toggle", "attempt", "define", "author", "archive", "grant", "pick", "ensure", "visit",
]);
const SKIP = new Set(["ui", "api", "via"]);
const WRAPPER_VERBS = new Set(["attempt", "ensure", "try"]);
const CONTEXT_WORDS = new Set(["from", "into", "in", "on", "expecting"]);
const MAX_USAGE = 120;

function entityOp(name) {
  const t = tokens(name).filter((x, i, all) => !(SKIP.has(x) && all.slice(0, i).every(y => SKIP.has(y))));
  if (WRAPPER_VERBS.has(t[0]) && VERBS.has(t[1])) t.shift();
  if (!t.length || !VERBS.has(t[0])) return "-";
  const cut = t.findIndex((x, i) => i > 0 && CONTEXT_WORDS.has(x));
  const rest = t.slice(1, cut === -1 ? undefined : cut).filter(x => !SKIP.has(x));
  if (!rest.length) return "-";
  const entity = rest[0] + rest.slice(1).map(x => x[0].toUpperCase() + x.slice(1)).join("");
  return `${entity}.${t[0]}`;
}

// Text the tag reader would cut (it stops a value at the first @ or *) is never proposed.
function usable(text) {
  return text.length <= MAX_USAGE && !/[@*]/.test(text);
}

function pickUsage(sites, preferred) {
  const isPreferred = typeof preferred === "function" ? preferred : (f) => preferred.includes(f);
  const ok = sites.filter(s => usable(s.text));
  ok.sort((a, b) =>
    (isPreferred(a.file) ? 0 : 1) - (isPreferred(b.file) ? 0 : 1)
    || (a.text.endsWith("()") ? 1 : 0) - (b.text.endsWith("()") ? 1 : 0)
    || a.text.length - b.text.length
    || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  return ok.length ? ok[0].text : "";
}

// area = null drafts every used symbol once, from all areas' specs together.
function draftTags(symbols, usage, area, isAreaSpec = (f) => areaOfSpec(f) === area) {
  const drafts = [];
  for (const s of symbols) {
    if (s.kind === "selector" || suiteForPath(s.file) === "appBuilder") continue;
    const u = usage.get(`${s.kind}:${s.name}`);
    if (!u || (area && !u.areas.has(area))) continue;
    let block = u.areas.size === 1 ? [...u.areas][0] : "shared";
    if (!validBlocks(suiteForPath(s.file)).includes(block)) block = "shared";
    drafts.push({
      name: s.name, kind: s.kind, file: s.file, line: s.line, duplicateName: s.id.includes("@"),
      block, type: entityOp(s.name), usage: s.usage || pickUsage(u.sites, isAreaSpec),
      usedBy: [...u.areas].sort(), calls: u.sites.length,
    });
  }
  return drafts.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.file < b.file ? -1 : 1));
}

function draftAllTags(symbols, usage) {
  return draftTags(symbols, usage, null, () => false);
}

function tagLine(indent, tag, value) {
  return `${indent} * ${("@" + tag).padEnd(9)} ${value}`;
}

// Adds missing @tjType/@tjBlock/@tjUsage above each record's declaration line. Existing lines are kept.
function applyTags(src, records) {
  const lines = src.split("\n");
  for (const r of [...records].sort((a, b) => b.line - a.line)) {
    const idx = r.line - 1;
    const indent = (lines[idx].match(/^\s*/) || [""])[0];
    let start = -1;
    let end = -1;
    if (idx > 0 && lines[idx - 1].trim().endsWith("*/")) {
      end = idx - 1;
      for (let k = end; k >= 0; k--) if (lines[k].trim().startsWith("/**")) { start = k; break; }
    }
    const existing = start === -1 ? "" : lines.slice(start, end + 1).join("\n");
    const wanted = [["tjType", r.type !== "-" ? r.type : ""], ["tjBlock", r.block], ["tjUsage", r.usage]];
    const add = wanted.filter(([tag, value]) => value && !new RegExp(`@${tag}\\b`).test(existing)).map(([tag, value]) => tagLine(indent, tag, value));
    if (!add.length) continue;
    if (start === -1) lines.splice(idx, 0, `${indent}/**`, ...add, `${indent} */`);
    else if (start === end) {
      const text = lines[start].trim().replace(/^\/\*\*\s*/, "").replace(/\s*\*\/$/, "");
      lines.splice(start, 1, `${indent}/**`, ...(text ? [`${indent} * ${text}`] : []), ...add, `${indent} */`);
    } else lines.splice(end, 0, ...add);
  }
  return lines.join("\n");
}

const cell = (v) => String(v).replace(/\|/g, "\\|");

function reviewTable(drafts, area) {
  const out = [
    `# Draft tags for ${area} (${drafts.length} symbols)`,
    "",
    "Usage examples are copied from real spec calls. Edit this table or tell Claude what to change; nothing is written until approved.",
    "",
    "| name | kind | file:line | block | type | usage | used by | calls |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const d of drafts)
    out.push(`| ${d.name}${d.duplicateName ? " ⚠ same name in another file" : ""} | ${d.kind} | ${d.file}:${d.line} | ${d.block} | ${d.type} | ${d.usage ? "`" + cell(d.usage) + "`" : "—"} | ${d.usedBy.join(", ")} | ${d.calls} |`);
  return out.join("\n") + "\n";
}

function writeTags(rootDir, drafts) {
  const byFile = new Map();
  for (const d of drafts) {
    if (!byFile.has(d.file)) byFile.set(d.file, []);
    byFile.get(d.file).push(d);
  }
  for (const [file, recs] of byFile) {
    const abs = path.join(rootDir, file);
    const before = fs.readFileSync(abs, "utf8");
    const after = applyTags(before, recs);
    if (after !== before) fs.writeFileSync(abs, after);
  }
  return [...byFile.keys()];
}

if (require.main === module) {
  const [mode, area] = process.argv.slice(2);
  if (!["--review", "--write"].includes(mode) || !(area === "all" || AREAS.includes(area))) {
    console.error(`usage: draft-tags.js --review|--write <area|all>\nareas: ${AREAS.join(", ")}`);
    process.exit(2);
  }
  const root = process.env.SUITE_INDEX_ROOT || path.join(__dirname, "../..");
  const symbols = collectSymbols(root).symbols;
  const usage = collectUsage(root, symbols);
  const drafts = area === "all" ? draftAllTags(symbols, usage) : draftTags(symbols, usage, area);
  if (mode === "--review") process.stdout.write(reviewTable(drafts, area));
  else console.log(`tagged ${drafts.length} symbols in:\n  ${writeTags(root, drafts).join("\n  ")}`);
}

module.exports = { entityOp, pickUsage, draftTags, draftAllTags, applyTags, reviewTable, writeTags };
