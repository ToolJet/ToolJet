// import-resolve-lint.js
//
// Verifies that every aliased import in the suite resolves — BOTH the module and
// the named bindings inside it.
//
//   node tools/component-automation/import-resolve-lint.js            # whole suite
//   node tools/component-automation/import-resolve-lint.js <file...>  # specific files
//
// Module-only resolution is not enough: a spec can import a name that no longer
// exists from a module that does, which webpack resolves to `undefined` and only
// fails at call time with "X is not a function". That is how 8 broken imports sat
// in the externalApi specs undetected.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const ALIAS = {
  Fixtures: "cypress/fixtures",
  Plugins: "cypress/plugins",
  Support: "cypress/support",
  Texts: "cypress/constants/texts",
  Selectors: "cypress/constants/selectors",
  Constants: "cypress/constants",
};
const SCAN_ROOTS = ["cypress/e2e", "cypress/support", "cypress/commands"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p, out) : p.endsWith(".js") && out.push(p);
  }
  return out;
}

/** Resolve an aliased specifier to a file on disk, or null. */
function resolveModule(spec) {
  const root = spec.split("/")[0];
  if (!ALIAS[root]) return undefined; // not an alias we own — skip
  const rel = ALIAS[root] + spec.slice(root.length);
  for (const c of [rel, rel + ".js", rel + ".json", path.join(rel, "index.js")]) {
    const abs = path.join(ROOT, c);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

/** Names a module exports: `export const x`, `export function x`, `export { a, b }`. */
const exportsOf = (() => {
  const cache = new Map();
  return (abs) => {
    if (cache.has(abs)) return cache.get(abs);
    const src = fs.readFileSync(abs, "utf8");
    const names = new Set();
    for (const m of src.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s*\{([^}]+)\}/gm))
      for (const part of m[1].split(","))
        names.add((part.split(/\s+as\s+/).pop() || "").trim());
    if (/^export\s+\*/m.test(src)) names.add("*"); // re-export barrel: cannot verify names
    cache.set(abs, names);
    return names;
  };
})();

const IMPORT_RE = /import\s*(?:\{([^}]*)\}|[A-Za-z0-9_$]+)?\s*from\s*["']([^"']+)["']/g;

function lintFile(abs) {
  const src = fs.readFileSync(abs, "utf8");
  const problems = [];
  for (const line of src.split("\n")) {
    if (line.trim().startsWith("//")) continue; // commented-out import
    IMPORT_RE.lastIndex = 0;
    const m = IMPORT_RE.exec(line);
    if (!m) continue;
    const [, named, spec] = m;
    const target = resolveModule(spec);
    if (target === undefined) continue; // relative or node_modules
    if (target === null) { problems.push({ kind: "module", spec }); continue; }
    if (!named) continue;
    const available = exportsOf(target);
    if (available.has("*")) continue; // barrel — names live elsewhere
    for (const raw of named.split(",").map((s) => s.trim()).filter(Boolean)) {
      const name = raw.split(/\s+as\s+/)[0].trim();
      if (!available.has(name)) problems.push({ kind: "name", spec, name });
    }
  }
  return problems;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const files = args.length
    ? args.map((f) => path.resolve(f))
    : SCAN_ROOTS.flatMap((r) => walk(path.join(ROOT, r)));

  let modBad = 0, nameBad = 0;
  for (const f of files) {
    for (const p of lintFile(f)) {
      const rel = path.relative(ROOT, f);
      if (p.kind === "module") { console.error(`${rel}: module not found — "${p.spec}"`); modBad++; }
      else { console.error(`${rel}: "${p.name}" is not exported by "${p.spec}"`); nameBad++; }
    }
  }
  const total = modBad + nameBad;
  if (total) {
    console.error(`\nimport-resolve-lint: ${total} problem(s) — ${modBad} missing module(s), ${nameBad} missing name(s), across ${files.length} file(s)`);
    process.exit(1);
  }
  console.log(`import-resolve-lint: clean (${files.length} files)`);
}

module.exports = { lintFile, resolveModule, exportsOf };
