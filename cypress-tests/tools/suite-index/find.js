const path = require("path");
const { AREAS } = require("./areas");
const { collectSymbols } = require("./generate");

function tokens(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(t => t.toLowerCase());
}

function score(rec, words) {
  const nameTokens = tokens(rec.name);
  const name = rec.name.toLowerCase();
  const type = (rec.type || []).join(" ").toLowerCase();
  const usage = (rec.usage || rec.expression || "").toLowerCase();
  const file = (rec.file || "").toLowerCase();
  let s = 0;
  for (const raw of words) {
    const w = raw.toLowerCase();
    if (nameTokens.includes(w)) s += 3;
    if (name.includes(w)) s += 2;
    if (type.includes(w)) s += 2;
    if (usage.includes(w)) s += 1;
    if (file.includes(w)) s += 1;
  }
  return s;
}

function findSymbols(symbols, area, words, opts = {}) {
  const limit = opts.limit || 5;
  return symbols
    .filter(r => r.areas.includes(area) || r.areas.includes("shared"))
    .filter(r => !opts.kind || r.kind === opts.kind)
    .map(record => ({ record, score: score(record, words) }))
    .filter(h => h.score > 0)
    .map(h => ({ ...h, score: h.score + (area !== "shared" && h.record.areas.includes(area) ? 2 : 0) }))
    .sort((a, b) => b.score - a.score || (a.record.name < b.record.name ? -1 : a.record.name > b.record.name ? 1 : 0))
    .slice(0, limit);
}

// Built from source on every call (about 0.2 s), so results are never stale.
function loadSymbols(rootDir) {
  return { symbols: collectSymbols(rootDir).symbols, source: "generated" };
}

function formatHit({ record: r }) {
  const usage = r.kind === "selector" ? r.expression : r.usage;
  return `${r.kind}  ${r.name}${r.signature || ""}  ${r.file}:${r.line}  ${usage || "-"}`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (flag) => { const i = args.indexOf(flag); if (i === -1) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
  const kind = opt("--kind");
  const limit = opt("--limit");
  const [area, ...words] = args;
  if (!area || !AREAS.includes(area) || !words.length) {
    console.error(`usage: suite:find -- <area> <words...> [--kind helper|command|selector] [--limit n]\nareas: ${AREAS.join(", ")}`);
    process.exit(2);
  }
  const root = process.env.SUITE_INDEX_ROOT || path.join(__dirname, "../..");
  const loaded = loadSymbols(root);
  const hits = findSymbols(loaded.symbols, area, words, { kind, limit: limit ? Number(limit) : undefined });
  if (!hits.length) {
    const searched = loaded.symbols.filter(r => r.areas.includes(area) || r.areas.includes("shared")).length;
    console.log(`no match in ${area}+shared (searched ${searched} symbols)`);
    process.exit(0);
  }
  hits.forEach(h => console.log(formatHit(h)));
}

module.exports = { findSymbols, loadSymbols, tokens, score };
